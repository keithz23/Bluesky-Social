import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, NotificationType, ReplyPolicy } from '@prisma/client';
import { Queue } from 'bullmq';
import { plainToInstance } from 'class-transformer';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants/queue.constant';
import {
  extractHashtags,
  extractMentions,
} from 'src/common/utils/extract.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto, UpdatePostDto } from '../dto/requests';
import { PostResponseDto } from '../dto/responses';
import { PostFormatterService } from './post-formatter.service';
import { PostHashtagService } from './post-hashtag.service';
import { ModeratedUploadResult, PostMediaService } from './post-media.service';
import { PostModerationService } from './post-moderation.service';
import { PostNotificationService } from './post-notification.service';

const FANOUT_WRITE_MAX_FOLLOWERS = 5000;

@Injectable()
export class PostCommandService {
  private readonly logger = new Logger(PostCommandService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly postNotifications: PostNotificationService,
    private readonly postFormatter: PostFormatterService,
    private readonly postHashtags: PostHashtagService,
    private readonly postMedia: PostMediaService,
    private readonly postModeration: PostModerationService,
    @InjectQueue(QUEUE_NAMES.FEED_FANOUT)
    private readonly feedFanoutQueue: Queue,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
    images?: Express.Multer.File[],
  ): Promise<PostResponseDto | null> {
    const { content, replyPrivacy, gifUrl, postTheme } = createPostDto;
    await this.postModeration.assertContentLength(content ?? '');
    let uploadResults: ModeratedUploadResult[] = [];
    const uploadedKeys: string[] = [];
    const mentionedUsernames = extractMentions(content ?? '');
    const hashtagNames = extractHashtags(content ?? '');

    const imageUpload = await this.postMedia.uploadImages(userId, images);
    uploadResults = imageUpload.uploadResults;
    uploadedKeys.push(...imageUpload.uploadedKeys);

    const gifUpload = await this.postMedia.uploadGif(
      userId,
      gifUrl,
      !images?.length && Boolean(gifUrl),
    );
    const gifUploadResult = gifUpload.gifUploadResult;
    uploadedKeys.push(...gifUpload.uploadedKeys);

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
              ...this.postMedia.getModerationData(u),
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
              ...this.postMedia.getModerationData(gifUploadResult),
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

        await this.postHashtags.attachHashtags(tx, created.id, hashtagNames);

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

      const keywordModerationResult = fullPost.post
        ? await this.postModeration.handleKeywordScan(
            fullPost.post.id,
            userId,
            fullPost.post.content,
          )
        : { matched: false, autoHidden: false };
      const imageModerationResult = fullPost.post
        ? await this.postModeration.handleImageScanResult(
            fullPost.post.id,
            userId,
            this.postMedia.collectModeratedUploads(
              uploadResults,
              gifUploadResult,
            ),
          )
        : { matched: false, autoHidden: false };
      const moderationResult = {
        matched:
          keywordModerationResult.matched || imageModerationResult.matched,
        autoHidden:
          keywordModerationResult.autoHidden ||
          imageModerationResult.autoHidden,
      };

      if (!moderationResult.autoHidden) {
        fullPost.mentionedUsers.forEach((user) => {
          this.postNotifications.sendSafely({
            type: NotificationType.MENTION,
            postId: fullPost.post?.id,
            actorId: userId,
            userId: user.id,
          });
        });
      }

      const postAfterScan = await this.prisma.post.findUnique({
        where: { id: fullPost.post!.id },
        select: { isDeleted: true },
      });

      if (!postAfterScan?.isDeleted) {
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
      }

      return fullPost.post
        ? plainToInstance(
            PostResponseDto,
            {
              ...fullPost.post,
              autoFlagged: moderationResult.matched,
              isDeleted: moderationResult.autoHidden,
            },
            { excludeExtraneousValues: true },
          )
        : null;
    } catch (error) {
      // Cleanup S3 if transaction fail
      if (uploadedKeys.length > 0) {
        await this.postMedia.scheduleCleanup(
          uploadedKeys,
          'transaction_failed',
        );
        this.logger.warn(
          `Scheduled cleanup for ${uploadedKeys.length} orphaned files`,
        );
      }
      throw error;
    }
  }

  async update(
    userId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
    images?: Express.Multer.File[],
  ) {
    let uploadResults: ModeratedUploadResult[] = [];
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

    await this.postModeration.assertContentLength(nextContent);

    if (!nextContent && finalMediaCount === 0) {
      throw new BadRequestException('Post cannot be empty');
    }

    const mentionedUsernames = extractMentions(nextContent);
    const hashtagNames = extractHashtags(nextContent);

    const mediaToDelete = post.media.filter(
      (media) => !keepMediaIds.includes(media.id),
    );

    const imageUpload = await this.postMedia.uploadImages(userId, images);
    uploadResults = imageUpload.uploadResults;
    uploadedKeys.push(...imageUpload.uploadedKeys);

    const gifUpload = await this.postMedia.uploadGif(
      userId,
      updatePostDto.gifUrl,
      addingGif,
    );
    const gifUploadResult = gifUpload.gifUploadResult;
    uploadedKeys.push(...gifUpload.uploadedKeys);

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
              ...this.postMedia.getModerationData(u),
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
              ...this.postMedia.getModerationData(gifUploadResult),
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
        await this.postHashtags.attachHashtags(tx, postId, hashtagNames);

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
              media.storageKey ??
              this.postMedia.extractKeyFromUrl(media.mediaUrl),
          )
          .filter(Boolean);
        if (keys.length > 0) {
          await this.postMedia.scheduleCleanup(keys, 'post_deleted');
        }
      }

      const keywordModerationResult =
        await this.postModeration.handleKeywordScan(
          updatedPost.id,
          userId,
          updatedPost.content,
        );
      const imageModerationResult =
        await this.postModeration.handleImageScanResult(
          updatedPost.id,
          userId,
          this.postMedia.collectModeratedUploads(
            uploadResults,
            gifUploadResult,
          ),
        );
      const moderationResult = {
        matched:
          keywordModerationResult.matched || imageModerationResult.matched,
        autoHidden:
          keywordModerationResult.autoHidden ||
          imageModerationResult.autoHidden,
      };

      if (!moderationResult.autoHidden) {
        fullPost.newlyMentionedUsers.forEach((user) => {
          this.postNotifications.sendSafely({
            type: NotificationType.MENTION,
            postId: updatedPost.id,
            actorId: userId,
            userId: user.id,
          });
        });
      }

      const enrichedPost = await this.postFormatter.enrichPost(
        userId,
        updatedPost,
        { includeAuthorFollowsMe: true },
      );

      return {
        ...enrichedPost,
        autoFlagged: moderationResult.matched,
        isDeleted: moderationResult.autoHidden,
      };
    } catch (error) {
      if (uploadedKeys.length > 0) {
        await this.postMedia.scheduleCleanup(
          uploadedKeys,
          'transaction_failed',
        );
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
      const keys = post.media.map((m) =>
        this.postMedia.extractKeyFromUrl(m.mediaUrl),
      );
      await this.postMedia.scheduleCleanup(keys, 'post_deleted');
    }
  }

  private normalizeKeepMediaIds(keepMediaIds?: string[] | string): string[] {
    if (!keepMediaIds) return [];

    return Array.isArray(keepMediaIds) ? keepMediaIds : [keepMediaIds];
  }
}
