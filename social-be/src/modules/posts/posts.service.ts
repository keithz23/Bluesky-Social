import {
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
import { MediaType, ReplyPolicy } from '@prisma/client';
import {
  CleanupJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { PostQueryDto } from './dto/post-query.dto';
import { CreateReplyDto } from './dto/create-reply.dto';

@Injectable()
export class PostsService {
  private logger = new Logger(PostsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private cleanupQueue: Queue<CleanupJobData>,
    @InjectQueue(QUEUE_NAMES.IMAGE_PROCESSING)
    private imageProcessingQueue: Queue,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    images?: Express.Multer.File[],
  ) {
    const { content, replyPrivacy, gifUrl } = createPostDto;
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
              mediaType: MediaType.IMAGE,
              fileSize: u.size,
              orderIndex: idx,
            })),
          });
        }

        if (gifUploadResult) {
          await tx.postMedia.create({
            data: {
              postId: created.id,
              mediaUrl: gifUploadResult.url,
              mediaType: MediaType.GIF,
              fileSize: gifUploadResult.size,
              orderIndex: 0,
            },
          });
        }

        return tx.post.findUnique({
          where: { id: created.id },
          include: {
            media: { orderBy: { orderIndex: 'asc' } },
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
                reposts: true,
                bookmarks: true,
              },
            },
          },
        });
      });

      return fullPost;
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
          ...(query.cursor && { postId: { lt: query.cursor } }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        select: {
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
              user: {
                select: {
                  id: true,
                  username: true,
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
      const nextCursor = hasMore ? likes[likes.length - 1].postId : null;

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
      ...(query.cursor && { id: { lt: query.cursor } }),
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
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
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
        user: {
          select: {
            id: true,
            username: true,
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
        rootPost: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            likeCount: true,
            replyCount: true,
            repostCount: true,
            replyPolicy: true,
            replyFollowers: true,
            replyFollowing: true,
            replyMentioned: true,
            user: {
              select: {
                id: true,
                username: true,
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
        },
        user: {
          select: {
            id: true,
            username: true,
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

    const [follow, liked, bookmarked, reposted, rootFollow, authorFollowsMe] =
      await Promise.all([
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

        post.rootPost?.user?.id
          ? this.prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: userId,
                  followingId: post.rootPost?.user.id,
                },
              },
            })
          : null,

        // Check author has followed current user
        this.prisma.follow.findMany({
          where: {
            followerId: post.user?.id, //Author
            followingId: userId, //current user
          },
        }),
      ]);

    return {
      ...post,
      isLiked: !!liked,
      isBookmarked: !!bookmarked,
      isReposted: !!reposted,
      rootPost: post.rootPost
        ? {
            ...post.rootPost,
            user: {
              ...post.rootPost.user,
              followStatus:
                post.rootPost.user.id === userId
                  ? null
                  : rootFollow
                    ? 'following'
                    : 'none',
              isFollowedByAuthor: !!authorFollowsMe,
            },
          }
        : null,
      user: {
        ...post.user,
        isFollowedByAuthor: !!authorFollowsMe,
        followStatus:
          post.user.id === userId ? null : follow ? 'following' : 'none',
      },
    };
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
      await tx.postMedia.deleteMany({ where: { postId } });

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

    const parentPost = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true, rootPostId: true },
    });

    if (!parentPost) throw new NotFoundException('Post not found');

    const rootPostId = parentPost.rootPostId ?? postId;

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
      const reply = await this.prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            content: content ?? '',
            parentPostId: postId,
            rootPostId,
            userId,
          },
        });

        await tx.post.update({
          where: { id: postId },
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
              mediaType: MediaType.IMAGE,
              fileSize: u.size,
              orderIndex: idx,
            })),
          });
        }

        if (gifUploadResult) {
          await tx.postMedia.create({
            data: {
              postId: created.id,
              mediaUrl: gifUploadResult.url,
              mediaType: MediaType.GIF,
              fileSize: gifUploadResult.size,
              orderIndex: 0,
            },
          });
        }

        return tx.post.findUnique({
          where: { id: created.id },
          include: {
            media: { orderBy: { orderIndex: 'asc' } },
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                verified: true,
              },
            },
          },
        });
      });

      return reply;
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
    const cursorDate = cursor ? new Date(cursor) : null;

    const replies = await this.prisma.post.findMany({
      where: {
        parentPostId: postId,
        isDeleted: false,
        ...(cursorDate &&
          !isNaN(cursorDate.getTime()) && {
            createdAt: { gt: cursorDate },
          }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        parentPostId: true,
        user: {
          select: {
            id: true,
            username: true,
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
            altText: true,
          },
        },
      },
    });

    const hasMore = replies.length > limit;
    if (hasMore) replies.pop();

    const nextCursor = hasMore
      ? replies[replies.length - 1].createdAt.toISOString()
      : null;

    const replyIds = replies.map((r) => r.id);

    const [likedPosts, bookmarkedPosts, repostedPosts] = await Promise.all([
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
    ]);

    const likedSet = new Set(likedPosts.map((l) => l.postId));
    const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
    const repostedSet = new Set(repostedPosts.map((r) => r.postId));

    return {
      replies: replies.map((r) => ({
        ...r,
        isLiked: likedSet.has(r.id),
        isBookmarked: bookmarkedSet.has(r.id),
        isReposted: repostedSet.has(r.id),
      })),
      nextCursor,
      hasMore,
    };
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

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1);
    } catch {
      return url;
    }
  }
}
