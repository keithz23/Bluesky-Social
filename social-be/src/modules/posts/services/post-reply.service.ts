import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MediaType, NotificationType } from '@prisma/client';
import {
  extractHashtags,
  extractMentions,
} from 'src/common/utils/extract.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReplyDto } from '../dto/requests';
import { SocketGateway } from '../../socket/socket.gateway';
import { PostHashtagService } from './post-hashtag.service';
import { ModeratedUploadResult, PostMediaService } from './post-media.service';
import { PostModerationService } from './post-moderation.service';
import { PostNotificationService } from './post-notification.service';
import { PostReplyPolicyService } from './post-reply-policy.service';
import { PostReplyQueryService } from './post-reply-query.service';

@Injectable()
export class PostReplyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketGateway: SocketGateway,
    private readonly postNotifications: PostNotificationService,
    private readonly postHashtags: PostHashtagService,
    private readonly postMedia: PostMediaService,
    private readonly postModeration: PostModerationService,
    private readonly replyPolicies: PostReplyPolicyService,
    private readonly replyQueries: PostReplyQueryService,
  ) {}

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
    await this.postModeration.assertContentLength(trimmedContent);

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

    const canReply = await this.replyPolicies.canReplyToPost(
      userId,
      parentPost,
    );
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

    let uploadResults: ModeratedUploadResult[] = [];
    const uploadedKeys: string[] = [];

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

        await this.postHashtags.attachHashtags(tx, created.id, hashtagNames);

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

      const keywordModerationResult =
        await this.postModeration.handleKeywordScan(
          reply.id,
          userId,
          reply.content,
        );
      const imageModerationResult =
        await this.postModeration.handleImageScanResult(
          reply.id,
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
        this.socketGateway.emitToPost(replyParentPostId, 'new-reply', reply);
        if (replyParentPostId !== postId) {
          this.socketGateway.emitToPost(postId, 'new-reply', reply);
        }

        if (parentPost.userId !== userId) {
          this.postNotifications.sendSafely({
            type: NotificationType.REPLY,
            postId: reply.id,
            actorId: userId,
            userId: parentPost.userId,
          });
        }

        if (fullReply.mentionedUsers.length > 0) {
          fullReply.mentionedUsers.forEach((user) => {
            this.postNotifications.sendSafely({
              type: NotificationType.MENTION,
              postId: reply.id,
              actorId: userId,
              userId: user.id,
            });
          });
        }
      }

      return {
        ...reply,
        autoFlagged: moderationResult.matched,
        isDeleted: moderationResult.autoHidden,
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
        await this.postMedia.scheduleCleanup(
          uploadedKeys,
          'transaction_failed',
        );
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
    return this.replyQueries.getReplies(userId, postId, cursor, limit);
  }
}
