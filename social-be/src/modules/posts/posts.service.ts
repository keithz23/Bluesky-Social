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
    });

    if (posts.length === 0)
      return { posts: [], nextCursor: null, hasMore: false };

    console.log(
      'limit:',
      limit,
      'posts.length:',
      posts.length,
      'hasMore:',
      posts.length > limit,
    );

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

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        isReposted: repostedSet.has(post.id),
      })),
      nextCursor,
      hasMore,
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
