import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/uploads/s3.service';
import { UploadResult } from 'src/common/interfaces/file-upload.interface';
import { MediaType, NotificationType, ReplyPolicy } from '@prisma/client';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import {
  extractHashtags,
  extractMentions,
} from 'src/common/utils/extract.util';
import { NotificationsService } from '../notifications/notifications.service';
import { SocketGateway } from '../socket/socket.gateway';
import { SearchPostsDto } from './dto/search-posts.dto';
import { PinPostQueryDto } from './dto/pin-post-query.dto';

const FANOUT_WRITE_MAX_FOLLOWERS = 5000;
@Injectable()
export class PostsService {
  private logger = new Logger(PostsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationsService,
    private readonly socketGateway: SocketGateway,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
    @InjectQueue(QUEUE_NAMES.IMAGE_PROCESSING)
    private imageProcessingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.FEED_FANOUT)
    private feedFanoutQueue: Queue,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    images?: Express.Multer.File[],
  ) {
    const { content, replyPrivacy, gifUrl, postTheme } = createPostDto;
    let uploadResults: UploadResult[] = [];
    const uploadedKeys: string[] = [];
    const mentionedUsernames = extractMentions(content ?? '');
    const hashtagNames = extractHashtags(content ?? '');

    if (images && images.length > 0) {
      try {
        uploadResults = await this.s3Service.uploadImages(
          images,
          `public/posts/${userId}/images`,
          { resize: true, quality: 85 },
        );
        uploadedKeys.push(...uploadResults.map((r) => r.key));
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload images');
      }
    }

    // Download GIF from URL,  upload to S3
    let gifUploadResult: UploadResult | null = null;
    if (!images?.length && gifUrl) {
      try {
        const response = await fetch(gifUrl);
        if (!response.ok) {
          throw new Error(`Failed to download GIF: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        gifUploadResult = await this.s3Service.uploadBuffer(
          buffer,
          `public/posts/${userId}/gifs`,
          'gif',
          'image/gif',
        );
        uploadedKeys.push(gifUploadResult.key);
      } catch (error) {
        this.logger.error('Error uploading GIF to S3', error);
        throw new Error('Failed to upload GIF');
      }
    }

    try {
      const fullPost = await this.prisma.$transaction(async (tx) => {
        // Create post
        const created = await tx.post.create({
          data: {
            content: content ?? '',
            replyPolicy: replyPrivacy?.type
              ? (replyPrivacy.type.toUpperCase() as ReplyPolicy)
              : 'ANYONE',
            replyFollowers:
              replyPrivacy?.type === 'custom' &&
              replyPrivacy?.custom?.followers === true,
            replyFollowing:
              replyPrivacy?.type === 'custom' &&
              replyPrivacy?.custom?.following === true,
            replyMentioned:
              replyPrivacy?.type === 'custom' &&
              replyPrivacy?.custom?.mentioned === true,
            userId,
            postTheme: postTheme
              ? {
                  type: postTheme.type,
                  background: postTheme.background,
                }
              : undefined,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                coverUrl: true,
              },
            },
            media: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                width: true,
                height: true,
                altText: true,
              },
            },
          },
        });

        // increment postsCount
        await tx.user.update({
          where: { id: userId },
          data: { postsCount: { increment: 1 } },
        });

        // Create media records
        if (uploadResults.length > 0) {
          await tx.postMedia.createMany({
            data: uploadResults.map((u, idx) => ({
              postId: created.id,
              mediaUrl: u.url,
              storageKey: u.key,
              mediaType: MediaType.IMAGE,
              fileSize: u.size,
              width: u.width,
              height: u.height,
              orderIndex: idx,
            })),
          });
        }

        if (gifUploadResult) {
          await tx.postMedia.create({
            data: {
              postId: created.id,
              mediaUrl: gifUploadResult.url,
              storageKey: gifUploadResult.key,
              mediaType: MediaType.GIF,
              fileSize: gifUploadResult.size,
              orderIndex: 0,
            },
          });
        }

        let mentionedUsers: { id: string; username: string }[] = [];
        if (mentionedUsernames.length > 0) {
          mentionedUsers = await tx.user.findMany({
            where: {
              username: { in: mentionedUsernames },
              id: { not: userId },
            },
            select: { id: true, username: true },
          });

          await tx.mention.createMany({
            data: mentionedUsers.map((user) => ({
              postId: created.id,
              userId: user.id,
              username: user.username,
            })),
            skipDuplicates: true,
          });
        }

        await this.attachHashtags(tx, created.id, hashtagNames);

        const post = await tx.post.findUnique({
          where: { id: created.id },
          select: {
            id: true,
            content: true,
            createdAt: true,
            likeCount: true,
            replyCount: true,
            repostCount: true,
            bookmarkCount: true,
            postTheme: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            media: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                width: true,
                height: true,
                altText: true,
              },
            },
          },
        });

        return { post, mentionedUsers };
      });

      if (fullPost.mentionedUsers.length > 0) {
        fullPost.mentionedUsers.forEach((user) => {
          this.notificationService.sendNotification({
            type: NotificationType.MENTION,
            postId: fullPost.post?.id,
            actorId: userId,
            userId: user.id,
          });
        });
      }

      try {
        const author = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { followersCount: true },
        });

        if ((author?.followersCount ?? 0) <= FANOUT_WRITE_MAX_FOLLOWERS) {
          await this.feedFanoutQueue.add(JOB_NAMES.FANOUT_POST, {
            postId: fullPost.post!.id,
            authorId: userId,
          });
        }
      } catch (error) {
        this.logger.warn('Failed to enqueue feed fanout job', error);
      }

      return fullPost.post;
    } catch (error) {
      // Cleanup S3 if transaction fail
      if (uploadedKeys.length > 0) {
        await this.scheduleCleanup(uploadedKeys, 'transaction_failed');
        this.logger.warn(
          `Scheduled cleanup for ${uploadedKeys.length} orphaned files`,
        );
      }
      throw error;
    }
  }

  async getPostByUsername(
    currentUserId: string,
    username: string,
    query: PostQueryDto,
  ) {
    const limit = query.limit ?? 20;

    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (query.filter === 'likes') {
      const likes = await this.prisma.like.findMany({
        where: {
          userId: user.id,
        },
        ...(query.cursor && {
          cursor: { id: query.cursor },
          skip: 1,
        }),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        select: {
          id: true,
          postId: true,
          post: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              likeCount: true,
              replyCount: true,
              repostCount: true,
              bookmarkCount: true,
              replyPolicy: true,
              replyFollowers: true,
              replyFollowing: true,
              replyMentioned: true,
              postTheme: true,
              isPinned: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verified: true,
                },
              },
              media: {
                orderBy: { orderIndex: 'asc' },
                select: {
                  id: true,
                  mediaUrl: true,
                  mediaType: true,
                  width: true,
                  height: true,
                  altText: true,
                },
              },
            },
          },
        },
      });

      const hasMore = likes.length > limit;
      if (hasMore) likes.pop();
      const nextCursor = hasMore ? likes[likes.length - 1].id : null;

      const postIds = likes.map((l) => l.postId);
      const [bookmarkedPosts, repostedPosts] = await Promise.all([
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.repost.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);

      const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
      const repostedSet = new Set(repostedPosts.map((r) => r.postId));

      return {
        posts: likes.map((l) => ({
          ...l.post,
          isLiked: true,
          isBookmarked: bookmarkedSet.has(l.postId),
          isReposted: repostedSet.has(l.postId),
        })),
        nextCursor,
        hasMore,
      };
    }

    const baseWhere = {
      userId: user.id,
      isDeleted: false,
    };

    const where = {
      posts: { ...baseWhere, parentPostId: null },
      replies: { ...baseWhere, parentPostId: { not: null } },
      media: { ...baseWhere, parentPostId: null, media: { some: {} } },
      videos: {
        ...baseWhere,
        parentPostId: null,
        media: { some: { mediaType: MediaType.VIDEO } },
      },
    }[query.filter ?? 'posts'] ?? { ...baseWhere, parentPostId: null };

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        postTheme: true,
        isPinned: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            followersCount: true,
            followingCount: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
      },
    });

    if (posts.length === 0)
      return { posts: [], nextCursor: null, hasMore: false };

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    const postIds = posts.map((p) => p.id);

    const [likedPosts, bookmarkedPosts, repostedPosts] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.repost.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    const likedSet = new Set(likedPosts.map((l) => l.postId));
    const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
    const repostedSet = new Set(repostedPosts.map((r) => r.postId));

    const following = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    const followingSet = new Set(followingIds);

    const userInfo = posts.length > 0 ? posts[0].user : null;

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        isReposted: repostedSet.has(post.id),
        user: userInfo
          ? {
              ...userInfo,
              followStatus:
                userInfo.id === currentUserId
                  ? null
                  : followingSet.has(userInfo.id)
                    ? 'following'
                    : 'none',
            }
          : null,
      })),
      nextCursor,
      hasMore,
    };
  }

  async searchPosts(currentUserId: string, query: SearchPostsDto) {
    const searchTerm = query.q.trim();
    const limit = query.limit ?? 20;

    if (!searchTerm) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const normalizedHashtag = searchTerm.startsWith('#')
      ? searchTerm.slice(1).toLowerCase()
      : searchTerm.toLowerCase();

    const [blocks, mutes, blockedBy] = await Promise.all([
      this.prisma.block.findMany({
        where: { blockerId: currentUserId },
        select: { blockedId: true },
      }),
      this.prisma.mute.findMany({
        where: { muterId: currentUserId },
        select: { mutedId: true },
      }),
      this.prisma.block.findMany({
        where: { blockedId: currentUserId },
        select: { blockerId: true },
      }),
    ]);

    const excludedUserIds = [
      ...blocks.map((block) => block.blockedId),
      ...mutes.map((mute) => mute.mutedId),
      ...blockedBy.map((block) => block.blockerId),
    ];

    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
        ...(query.ownOnly
          ? { userId: currentUserId }
          : excludedUserIds.length > 0 && {
              userId: { notIn: excludedUserIds },
            }),
        OR: [
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            hashtags: {
              some: {
                hashtag: {
                  name: {
                    contains: normalizedHashtag,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        parentPostId: true,
        rootPostId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            followersCount: true,
            followingCount: true,
            bio: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
      },
    });

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    if (posts.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const postIds = posts.map((post) => post.id);
    const authorIds = [...new Set(posts.map((post) => post.user.id))];

    const [likedPosts, bookmarkedPosts, repostedPosts, following] =
      await Promise.all([
        this.prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.repost.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.follow.findMany({
          where: { followerId: currentUserId, followingId: { in: authorIds } },
          select: { followingId: true },
        }),
      ]);

    const likedSet = new Set(likedPosts.map((like) => like.postId));
    const bookmarkedSet = new Set(
      bookmarkedPosts.map((bookmark) => bookmark.postId),
    );
    const repostedSet = new Set(repostedPosts.map((repost) => repost.postId));
    const followingSet = new Set(following.map((follow) => follow.followingId));

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        isReposted: repostedSet.has(post.id),
        user: {
          ...post.user,
          followStatus:
            post.user.id === currentUserId
              ? null
              : followingSet.has(post.user.id)
                ? 'following'
                : 'none',
        },
      })),
      nextCursor,
      hasMore,
    };
  }

  async getPostDetail(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        allowQuote: true,
        parentPostId: true,
        rootPostId: true,
        postTheme: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            bio: true,
            followersCount: true,
            followingCount: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    // Build parent chain (root → ... → immediate parent)
    const parentChain: any[] = [];
    if (post.parentPostId) {
      let currentParentId: string | null = post.parentPostId;
      const maxDepth = 20;
      let depth = 0;
      while (currentParentId && depth < maxDepth) {
        const parent = await this.prisma.post.findUnique({
          where: { id: currentParentId, isDeleted: false },
          select: {
            id: true,
            content: true,
            createdAt: true,
            parentPostId: true,
            likeCount: true,
            replyCount: true,
            repostCount: true,
            bookmarkCount: true,
            replyPolicy: true,
            replyFollowers: true,
            replyFollowing: true,
            replyMentioned: true,
            postTheme: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                verified: true,
                bio: true,
                followersCount: true,
                followingCount: true,
              },
            },
            media: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                width: true,
                height: true,
                altText: true,
              },
            },
          },
        });
        if (!parent) break;
        parentChain.unshift(parent);
        currentParentId = parent.parentPostId;
        depth++;
      }
    }

    const parentIds = parentChain.map((p) => p.id);
    const allUserIds = [
      ...new Set([post.user.id, ...parentChain.map((p) => p.user.id)]),
    ];

    const [
      follow,
      liked,
      bookmarked,
      reposted,
      parentLikes,
      parentBookmarks,
      parentReposts,
      parentFollows,
      authorsFollowingMe,
    ] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: post.user.id,
          },
        },
      }),
      this.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      this.prisma.bookmark.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      this.prisma.repost.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      parentIds.length > 0
        ? this.prisma.like.findMany({
            where: { userId, postId: { in: parentIds } },
            select: { postId: true },
          })
        : [],
      parentIds.length > 0
        ? this.prisma.bookmark.findMany({
            where: { userId, postId: { in: parentIds } },
            select: { postId: true },
          })
        : [],
      parentIds.length > 0
        ? this.prisma.repost.findMany({
            where: { userId, postId: { in: parentIds } },
            select: { postId: true },
          })
        : [],
      this.prisma.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: allUserIds },
        },
        select: { followingId: true },
      }),
      this.prisma.follow.findMany({
        where: {
          followerId: { in: allUserIds },
          followingId: userId,
        },
        select: { followerId: true },
      }),
    ]);

    const parentLikeSet = new Set(
      (parentLikes as { postId: string }[]).map((l) => l.postId),
    );
    const parentBookmarkSet = new Set(
      (parentBookmarks as { postId: string }[]).map((b) => b.postId),
    );
    const parentRepostSet = new Set(
      (parentReposts as { postId: string }[]).map((r) => r.postId),
    );
    const followSet = new Set(
      (parentFollows as { followingId: string }[]).map((f) => f.followingId),
    );
    const authorFollowsMeSet = new Set(
      (authorsFollowingMe as { followerId: string }[]).map((f) => f.followerId),
    );

    const enrichedParentChain = parentChain.map((parent) => ({
      ...parent,
      isLiked: parentLikeSet.has(parent.id),
      isBookmarked: parentBookmarkSet.has(parent.id),
      isReposted: parentRepostSet.has(parent.id),
      user: {
        ...parent.user,
        followStatus:
          parent.user.id === userId
            ? null
            : followSet.has(parent.user.id)
              ? 'following'
              : 'none',
        isFollowedByAuthor: authorFollowsMeSet.has(parent.user.id),
      },
    }));

    return {
      ...post,
      isLiked: !!liked,
      isBookmarked: !!bookmarked,
      isReposted: !!reposted,
      parentChain: enrichedParentChain,
      user: {
        ...post.user,
        followStatus:
          post.user.id === userId
            ? null
            : followSet.has(post.user.id)
              ? 'following'
              : 'none',
        isFollowedByAuthor: authorFollowsMeSet.has(post.user.id),
      },
    };
  }

  async update(
    userId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
    images?: Express.Multer.File[],
  ) {
    let uploadResults: UploadResult[] = [];
    const uploadedKeys: string[] = [];
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: {
        media: true,
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId)
      throw new ForbiddenException(
        'You are not authorized to update this post',
      );

    const keepMediaIds =
      updatePostDto.keepMediaIds === undefined
        ? post.media.map((media) => media.id)
        : this.normalizeKeepMediaIds(updatePostDto.keepMediaIds);
    const newImages = images || [];
    const addingGif = !newImages.length && Boolean(updatePostDto.gifUrl);

    // Use filter for get anything if you want
    const invalidKeepIds = keepMediaIds.filter(
      (id) => !post.media.some((media) => media.id === id),
    );

    if (invalidKeepIds.length > 0) {
      throw new BadRequestException('Invalid media ids');
    }

    const keptMedia = post.media.filter((media) =>
      keepMediaIds.includes(media.id),
    );
    const hasKeptGif = keptMedia.some(
      (media) => media.mediaType === MediaType.GIF,
    );
    const hasKeptImage = keptMedia.some(
      (media) => media.mediaType === MediaType.IMAGE,
    );

    if (newImages.length && updatePostDto.gifUrl) {
      throw new BadRequestException('GIF cannot be combined with images');
    }

    if ((hasKeptGif && newImages.length) || (hasKeptImage && addingGif)) {
      throw new BadRequestException('GIF cannot be combined with images');
    }

    const finalMediaCount =
      keepMediaIds.length + newImages.length + (addingGif ? 1 : 0);

    if (finalMediaCount > 4)
      throw new BadRequestException('Maximum 4 images allowed');

    const nextContent =
      updatePostDto.content === undefined
        ? post.content
        : updatePostDto.content.trim();

    if (!nextContent && finalMediaCount === 0) {
      throw new BadRequestException('Post cannot be empty');
    }

    const mentionedUsernames = extractMentions(nextContent);
    const hashtagNames = extractHashtags(nextContent);

    const mediaToDelete = post.media.filter(
      (media) => !keepMediaIds.includes(media.id),
    );

    if (images && images.length > 0) {
      try {
        uploadResults = await this.s3Service.uploadImages(
          images,
          `public/posts/${userId}/images`,
          { resize: true, quality: 85 },
        );
        uploadedKeys.push(...uploadResults.map((r) => r.key));
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload images');
      }
    }

    // Download GIF from URL,  upload to S3
    let gifUploadResult: UploadResult | null = null;
    if (addingGif && updatePostDto.gifUrl) {
      try {
        const response = await fetch(updatePostDto.gifUrl);
        if (!response.ok) {
          throw new Error(`Failed to download GIF: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        gifUploadResult = await this.s3Service.uploadBuffer(
          buffer,
          `public/posts/${userId}/gifs`,
          'gif',
          'image/gif',
        );
        uploadedKeys.push(gifUploadResult.key);
      } catch (error) {
        this.logger.error('Error uploading GIF to S3', error);
        throw new Error('Failed to upload GIF');
      }
    }

    try {
      const fullPost = await this.prisma.$transaction(async (tx) => {
        const previousHashtags = await tx.postHashtag.findMany({
          where: { postId },
          select: { hashtagId: true },
        });
        const previousMentions = await tx.mention.findMany({
          where: { postId },
          select: { userId: true },
        });
        const previousMentionIds = new Set(
          previousMentions.map((mention) => mention.userId),
        );

        if (mediaToDelete.length > 0) {
          await tx.postMedia.deleteMany({
            where: {
              id: { in: mediaToDelete.map((media) => media.id) },
              postId,
            },
          });
        }

        await Promise.all(
          keptMedia.map((media, index) =>
            tx.postMedia.update({
              where: { id: media.id },
              data: { orderIndex: index },
            }),
          ),
        );

        if (uploadResults.length > 0) {
          await tx.postMedia.createMany({
            data: uploadResults.map((u, idx) => ({
              postId,
              mediaUrl: u.url,
              storageKey: u.key,
              mediaType: MediaType.IMAGE,
              fileSize: u.size,
              width: u.width,
              height: u.height,
              orderIndex: keptMedia.length + idx,
            })),
          });
        }

        if (gifUploadResult) {
          await tx.postMedia.create({
            data: {
              postId,
              mediaUrl: gifUploadResult.url,
              storageKey: gifUploadResult.key,
              mediaType: MediaType.GIF,
              fileSize: gifUploadResult.size,
              orderIndex: 0,
            },
          });
        }

        const replyPrivacy = updatePostDto.replyPrivacy;
        await tx.post.update({
          where: { id: postId },
          data: {
            content: nextContent,
            ...(replyPrivacy && {
              replyPolicy: replyPrivacy.type
                ? (replyPrivacy.type.toUpperCase() as ReplyPolicy)
                : post.replyPolicy,
              allowQuote: replyPrivacy.allowQuote,
              replyFollowers:
                replyPrivacy.type === 'custom' &&
                replyPrivacy.custom?.followers === true,
              replyFollowing:
                replyPrivacy.type === 'custom' &&
                replyPrivacy.custom?.following === true,
              replyMentioned:
                replyPrivacy.type === 'custom' &&
                replyPrivacy.custom?.mentioned === true,
            }),
          },
        });

        await tx.mention.deleteMany({ where: { postId } });

        let mentionedUsers: { id: string; username: string }[] = [];
        if (mentionedUsernames.length > 0) {
          mentionedUsers = await tx.user.findMany({
            where: {
              username: { in: mentionedUsernames },
              id: { not: userId },
            },
            select: { id: true, username: true },
          });

          await tx.mention.createMany({
            data: mentionedUsers.map((user) => ({
              postId,
              userId: user.id,
              username: user.username,
            })),
            skipDuplicates: true,
          });
        }

        await tx.postHashtag.deleteMany({ where: { postId } });
        if (previousHashtags.length > 0) {
          await tx.hashtag.updateMany({
            where: {
              id: {
                in: previousHashtags.map((hashtag) => hashtag.hashtagId),
              },
            },
            data: { postCount: { decrement: 1 } },
          });
        }
        await this.attachHashtags(tx, postId, hashtagNames);

        const updated = await tx.post.findUnique({
          where: { id: postId },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            likeCount: true,
            replyCount: true,
            repostCount: true,
            bookmarkCount: true,
            parentPostId: true,
            rootPostId: true,
            replyPolicy: true,
            replyFollowers: true,
            replyFollowing: true,
            replyMentioned: true,
            allowQuote: true,
            media: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                width: true,
                height: true,
                altText: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                verified: true,
                followersCount: true,
                followingCount: true,
              },
            },
          },
        });

        return {
          post: updated,
          newlyMentionedUsers: mentionedUsers.filter(
            (user) => !previousMentionIds.has(user.id),
          ),
        };
      });

      const updatedPost = fullPost.post;
      if (!updatedPost) throw new Error('Failed to update post');

      if (mediaToDelete.length > 0) {
        const keys = mediaToDelete
          .map(
            (media) =>
              media.storageKey ?? this.extractKeyFromUrl(media.mediaUrl),
          )
          .filter(Boolean);
        if (keys.length > 0) {
          await this.scheduleCleanup(keys, 'post_deleted');
        }
      }

      fullPost.newlyMentionedUsers.forEach((user) => {
        this.notificationService.sendNotification({
          type: NotificationType.MENTION,
          postId: updatedPost.id,
          actorId: userId,
          userId: user.id,
        });
      });

      const [liked, bookmarked, reposted, follow, authorFollowsMe] =
        await Promise.all([
          this.prisma.like.findUnique({
            where: { userId_postId: { userId, postId } },
          }),
          this.prisma.bookmark.findUnique({
            where: { userId_postId: { userId, postId } },
          }),
          this.prisma.repost.findUnique({
            where: { userId_postId: { userId, postId } },
          }),
          this.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: userId,
                followingId: updatedPost.user.id,
              },
            },
          }),
          this.prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: updatedPost.user.id,
                followingId: userId,
              },
            },
          }),
        ]);

      return {
        ...updatedPost,
        isLiked: !!liked,
        isBookmarked: !!bookmarked,
        isReposted: !!reposted,
        user: {
          ...updatedPost.user,
          followStatus:
            updatedPost.user.id === userId
              ? null
              : follow
                ? 'following'
                : 'none',
          isFollowedByAuthor: !!authorFollowsMe,
        },
      };
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await this.scheduleCleanup(uploadedKeys, 'transaction_failed');
      }
      throw error;
    }
  }

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: { media: true },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId)
      throw new ForbiddenException(
        'Your are not authorized to delete this post',
      );

    await this.prisma.$transaction(async (tx) => {
      const hashtags = await tx.postHashtag.findMany({
        where: { postId },
        select: { hashtagId: true },
      });

      await tx.postMedia.deleteMany({ where: { postId } });
      await tx.homeTimeline.deleteMany({ where: { postId } });

      if (post.parentPostId) {
        await tx.post.update({
          where: { id: post.parentPostId },
          data: { replyCount: { decrement: 1 } },
        });
      }

      await tx.user.update({
        where: {
          id: post.userId,
        },
        data: {
          postsCount: { decrement: 1 },
        },
      });

      await tx.post.delete({ where: { id: postId } });

      if (hashtags.length > 0) {
        await tx.hashtag.updateMany({
          where: { id: { in: hashtags.map((hashtag) => hashtag.hashtagId) } },
          data: { postCount: { decrement: 1 } },
        });
      }
    });

    // Schedule s3 cleanup
    if (post.media.length > 0) {
      const keys = post.media.map((m) => this.extractKeyFromUrl(m.mediaUrl));
      await this.scheduleCleanup(keys, 'post_deleted');
    }
  }

  async createReply(
    userId: string,
    postId: string,
    createReplyDto: CreateReplyDto,
    images?: Express.Multer.File[],
  ) {
    const { content, gifUrl } = createReplyDto;
    const hashtagNames = extractHashtags(content ?? '');
    const mentionedUsernames = extractMentions(content ?? '');
    const trimmedContent = content?.trim() ?? '';

    const parentPost = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: {
        id: true,
        content: true,
        parentPostId: true,
        rootPostId: true,
        userId: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
      },
    });

    if (!parentPost) throw new NotFoundException('Post not found');
    if (!trimmedContent && !gifUrl && !images?.length) {
      throw new BadRequestException('Reply cannot be empty');
    }

    const canReply = await this.canReplyToPost(userId, parentPost);
    if (!canReply) {
      throw new ForbiddenException('You cannot reply to this post');
    }

    const rootPostId = parentPost.rootPostId ?? postId;
    const isSecondLevelReply =
      !!parentPost.rootPostId &&
      !!parentPost.parentPostId &&
      parentPost.parentPostId !== parentPost.rootPostId;
    const replyParentPostId: string =
      isSecondLevelReply && parentPost.parentPostId
        ? parentPost.parentPostId
        : postId;

    let uploadResults: UploadResult[] = [];
    const uploadedKeys: string[] = [];

    if (images && images.length > 0) {
      try {
        uploadResults = await this.s3Service.uploadImages(
          images,
          `public/posts/${userId}/images`,
          { resize: true, quality: 85 },
        );
        uploadedKeys.push(...uploadResults.map((r) => r.key));
      } catch (error) {
        this.logger.error('Error uploading images', error);
        throw new Error('Failed to upload images');
      }
    }

    let gifUploadResult: UploadResult | null = null;
    if (!images?.length && gifUrl) {
      try {
        const response = await fetch(gifUrl);
        if (!response.ok) {
          throw new Error(`Failed to download GIF: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        gifUploadResult = await this.s3Service.uploadBuffer(
          buffer,
          `public/posts/${userId}/gifs`,
          'gif',
          'image/gif',
        );
        uploadedKeys.push(gifUploadResult.key);
      } catch (error) {
        this.logger.error('Error uploading GIF to S3', error);
        throw new Error('Failed to upload GIF');
      }
    }

    try {
      const fullReply = await this.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            content: trimmedContent,
            parentPostId: replyParentPostId,
            rootPostId,
            userId,
          },
        });

        await tx.post.update({
          where: { id: replyParentPostId },
          data: { replyCount: { increment: 1 } },
        });

        await tx.user.update({
          where: { id: userId },
          data: { postsCount: { increment: 1 } },
        });

        if (uploadResults.length > 0) {
          await tx.postMedia.createMany({
            data: uploadResults.map((u, idx) => ({
              postId: created.id,
              mediaUrl: u.url,
              storageKey: u.key,
              mediaType: MediaType.IMAGE,
              fileSize: u.size,
              width: u.width,
              height: u.height,
              orderIndex: idx,
            })),
          });
        }

        if (gifUploadResult) {
          await tx.postMedia.create({
            data: {
              postId: created.id,
              mediaUrl: gifUploadResult.url,
              storageKey: gifUploadResult.key,
              mediaType: MediaType.GIF,
              fileSize: gifUploadResult.size,
              orderIndex: 0,
            },
          });
        }

        await this.attachHashtags(tx, created.id, hashtagNames);

        let mentionedUsers: { id: string; username: string }[] = [];
        if (mentionedUsernames.length > 0) {
          mentionedUsers = await tx.user.findMany({
            where: {
              username: { in: mentionedUsernames },
              id: { not: userId },
            },
            select: { id: true, username: true },
          });

          await tx.mention.createMany({
            data: mentionedUsers.map((user) => ({
              postId: created.id,
              userId: user.id,
              username: user.username,
            })),
            skipDuplicates: true,
          });
        }

        const reply = await tx.post.findUnique({
          where: { id: created.id },
          select: {
            id: true,
            content: true,
            createdAt: true,
            likeCount: true,
            replyCount: true,
            repostCount: true,
            bookmarkCount: true,
            parentPostId: true,
            rootPostId: true,
            replyPolicy: true,
            replyFollowers: true,
            replyFollowing: true,
            replyMentioned: true,
            media: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                mediaUrl: true,
                mediaType: true,
                width: true,
                height: true,
                altText: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                verified: true,
                followersCount: true,
                followingCount: true,
              },
            },
          },
        });

        return { reply, mentionedUsers };
      });

      const reply = fullReply.reply;
      if (!reply) throw new Error('Failed to create reply');

      this.socketGateway.emitToPost(replyParentPostId, 'new-reply', reply);
      if (replyParentPostId !== postId) {
        this.socketGateway.emitToPost(postId, 'new-reply', reply);
      }

      if (parentPost.userId !== userId) {
        this.notificationService.sendNotification({
          type: NotificationType.REPLY,
          postId: reply.id,
          actorId: userId,
          userId: parentPost.userId,
        });
      }

      if (fullReply.mentionedUsers.length > 0) {
        fullReply.mentionedUsers.forEach((user) => {
          this.notificationService.sendNotification({
            type: NotificationType.MENTION,
            postId: reply.id,
            actorId: userId,
            userId: user.id,
          });
        });
      }

      return {
        ...reply,
        isLiked: false,
        isBookmarked: false,
        isReposted: false,
        user: {
          ...reply.user,
          followStatus: null,
          isFollowedByAuthor: false,
        },
      };
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await this.scheduleCleanup(uploadedKeys, 'transaction_failed');
      }
      throw error;
    }
  }

  async getReplies(
    userId: string,
    postId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const pageSize = Number(limit) || 20;

    const replies = await this.prisma.post.findMany({
      where: {
        parentPostId: postId,
        isDeleted: false,
      },
      take: pageSize + 1,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        parentPostId: true,
        rootPostId: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            followersCount: true,
            followingCount: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
      },
    });

    const hasMore = replies.length > pageSize;
    if (hasMore) replies.pop();

    const nextCursor = hasMore ? replies[replies.length - 1].id : null;

    const replyIds = replies.map((r) => r.id);
    const authorIds = [...new Set(replies.map((r) => r.user.id))];

    const [
      likedPosts,
      bookmarkedPosts,
      repostedPosts,
      following,
      authorsFollowingMe,
    ] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, postId: { in: replyIds } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId, postId: { in: replyIds } },
        select: { postId: true },
      }),
      this.prisma.repost.findMany({
        where: { userId, postId: { in: replyIds } },
        select: { postId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: userId, followingId: { in: authorIds } },
        select: { followingId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: { in: authorIds }, followingId: userId },
        select: { followerId: true },
      }),
    ]);

    const likedSet = new Set(likedPosts.map((l) => l.postId));
    const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
    const repostedSet = new Set(repostedPosts.map((r) => r.postId));
    const followingSet = new Set(following.map((f) => f.followingId));
    const authorFollowsMeSet = new Set(
      authorsFollowingMe.map((f) => f.followerId),
    );

    return {
      replies: replies.map((r) => ({
        ...r,
        isLiked: likedSet.has(r.id),
        isBookmarked: bookmarkedSet.has(r.id),
        isReposted: repostedSet.has(r.id),
        user: {
          ...r.user,
          followStatus:
            r.user.id === userId
              ? null
              : followingSet.has(r.user.id)
                ? 'following'
                : 'none',
          isFollowedByAuthor: authorFollowsMeSet.has(r.user.id),
        },
      })),
      nextCursor,
      hasMore,
    };
  }

  async pinPost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId) {
      throw new ForbiddenException('You are not authorized to pin this post');
    }

    if (post.isPinned) {
      return { message: 'Post pinned successfully' };
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { isPinned: true },
    });

    return { message: 'Post pinned successfully' };
  }

  async getPinPost(
    username: string,
    currentUserId: string,
    query: PinPostQueryDto,
  ) {
    const limit = query.limit ?? 20;
    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const posts = await this.prisma.post.findMany({
      where: { userId: user.id, isPinned: true, isDeleted: false },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        postTheme: true,
        isPinned: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            followersCount: true,
            followingCount: true,
          },
        },
        media: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
      },
    });

    if (posts.length === 0)
      return { posts: [], nextCursor: null, hasMore: false };

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    const postIds = posts.map((p) => p.id);

    const [likedPosts, bookmarkedPosts, repostedPosts] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.repost.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);

    const likedSet = new Set(likedPosts.map((l) => l.postId));
    const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
    const repostedSet = new Set(repostedPosts.map((r) => r.postId));

    const following = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    const followingSet = new Set(followingIds);

    const userInfo = posts.length > 0 ? posts[0].user : null;

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        isReposted: repostedSet.has(post.id),
        user: userInfo
          ? {
              ...userInfo,
              followStatus:
                userInfo.id === currentUserId
                  ? null
                  : followingSet.has(userInfo.id)
                    ? 'following'
                    : 'none',
            }
          : null,
      })),
      nextCursor,
      hasMore,
    };
  }

  async unpinPost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId)
      throw new ForbiddenException('You are not authorized to unpin this post');

    await this.prisma.post.update({
      where: { id: postId },
      data: { isPinned: false },
    });

    return { message: 'Post unpinned successfully' };
  }

  private async canReplyToPost(
    userId: string,
    post: {
      userId: string;
      content: string;
      replyPolicy: ReplyPolicy;
      replyFollowers: boolean;
      replyFollowing: boolean;
      replyMentioned: boolean;
    },
  ) {
    if (post.userId === userId) return true;
    if (post.replyPolicy === ReplyPolicy.ANYONE) return true;
    if (post.replyPolicy === ReplyPolicy.NOBODY) return false;

    const checks: Promise<unknown>[] = [];

    if (post.replyFollowers) {
      checks.push(
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: post.userId,
            },
          },
        }),
      );
    }

    if (post.replyFollowing) {
      checks.push(
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: post.userId,
              followingId: userId,
            },
          },
        }),
      );
    }

    if (post.replyMentioned) {
      checks.push(
        this.prisma.user
          .findUnique({
            where: { id: userId },
            select: { username: true },
          })
          .then((user) => {
            if (!user?.username) return null;
            const mentionRegex = new RegExp(
              `@${this.escapeRegExp(user.username)}\\b`,
              'i',
            );
            return mentionRegex.test(post.content) ? user : null;
          }),
      );
    }

    if (checks.length === 0) return false;
    const results = await Promise.all(checks);
    return results.some(Boolean);
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private async scheduleCleanup(
    keys: string[],
    reason: CleanupJobData['reason'],
  ) {
    await this.cleanupQueue.add(
      JOB_NAMES.CLEANUP_FAILED_UPLOAD,
      { keys, reason },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        delay: 1000, // Delay 1s before cleanup
      },
    );
  }

  private async attachHashtags(
    tx: any,
    postId: string,
    hashtagNames: string[],
  ) {
    if (hashtagNames.length === 0) return;

    const hashtags = await Promise.all(
      hashtagNames.map((name) =>
        tx.hashtag.upsert({
          where: { name },
          create: { name, postCount: 1 },
          update: { postCount: { increment: 1 } },
          select: { id: true },
        }),
      ),
    );

    await tx.postHashtag.createMany({
      data: hashtags.map((hashtag) => ({
        postId,
        hashtagId: hashtag.id,
      })),
      skipDuplicates: true,
    });
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return url;
    }
  }

  private normalizeKeepMediaIds(keepMediaIds?: string[] | string): string[] {
    if (!keepMediaIds) return [];

    if (Array.isArray(keepMediaIds)) {
      return keepMediaIds;
    }

    return [keepMediaIds];
  }
}
