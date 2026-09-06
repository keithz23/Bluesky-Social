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
import { PostMutationService } from './post-mutation.service';

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
    private readonly postMutations: PostMutationService,
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

  update(
    userId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
    images?: Express.Multer.File[],
  ) {
    return this.postMutations.update(userId, postId, updatePostDto, images);
  }

  delete(userId: string, postId: string) {
    return this.postMutations.delete(userId, postId);
  }

}
