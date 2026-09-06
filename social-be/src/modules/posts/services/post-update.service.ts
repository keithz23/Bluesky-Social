import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, NotificationType, ReplyPolicy } from '@prisma/client';
import {
  extractHashtags,
  extractMentions,
} from 'src/common/utils/extract.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePostDto } from '../dto/requests';
import { PostFormatterService } from './post-formatter.service';
import { PostHashtagService } from './post-hashtag.service';
import { ModeratedUploadResult, PostMediaService } from './post-media.service';
import { PostModerationService } from './post-moderation.service';
import { PostNotificationService } from './post-notification.service';

@Injectable()
export class PostUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postNotifications: PostNotificationService,
    private readonly postFormatter: PostFormatterService,
    private readonly postHashtags: PostHashtagService,
    private readonly postMedia: PostMediaService,
    private readonly postModeration: PostModerationService,
  ) {}

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

  private normalizeKeepMediaIds(keepMediaIds?: string[] | string): string[] {
    if (!keepMediaIds) return [];

    return Array.isArray(keepMediaIds) ? keepMediaIds : [keepMediaIds];
  }
}
