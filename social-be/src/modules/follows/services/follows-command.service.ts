import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { NotificationType } from '@prisma/client';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class FollowsCommandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationsService,
    @InjectQueue(QUEUE_NAMES.FEED_FANOUT)
    private readonly feedFanoutQueue: Queue,
  ) {}

  async follow(followerId: string, followingId: string) {
    if (followerId == followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, isPrivate: true },
    });

    if (!targetUser) throw new NotFoundException('User not found');

    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (existing) throw new BadRequestException('Already following');

    if (targetUser.isPrivate) {
      return this.createFollowRequest(followerId, followingId);
    }

    await this.prisma.$transaction([
      this.prisma.follow.create({
        data: { followerId, followingId },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

    await this.feedFanoutQueue.add(JOB_NAMES.BACKFILL_USER_FEED, {
      followerId,
      followingId,
    });

    return { success: true, status: 'following' };
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!existing) throw new BadRequestException('Not following');

    await this.prisma.$transaction([
      this.prisma.follow.delete({
        where: {
          followerId_followingId: { followerId, followingId },
        },
      }),
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      }),
    ]);

    await this.feedFanoutQueue.add(JOB_NAMES.CLEANUP_AUTHOR_FEED, {
      userId: followerId,
      authorId: followingId,
    });

    return { success: true, status: 'unfollowed' };
  }

  async acceptFollowRequest(currentUserId: string, senderId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: { senderId, receiverId: currentUserId },
      },
    });

    if (!request) throw new NotFoundException('Follow request not found');

    await this.prisma.$transaction([
      this.prisma.followRequest.delete({
        where: {
          senderId_receiverId: { senderId, receiverId: currentUserId },
        },
      }),
      this.prisma.follow.create({
        data: { followerId: senderId, followingId: currentUserId },
      }),
      this.prisma.user.update({
        where: { id: senderId },
        data: { followingCount: { increment: 1 } },
      }),
      this.prisma.user.update({
        where: { id: currentUserId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

    await this.feedFanoutQueue.add(JOB_NAMES.BACKFILL_USER_FEED, {
      followerId: senderId,
      followingId: currentUserId,
    });

    await this.notificationService.sendNotification({
      userId: senderId,
      actorId: currentUserId,
      type: NotificationType.FOLLOW_REQUEST,
    });

    await this.notificationService.deleteNotificationForActor({
      userId: currentUserId,
      actorId: senderId,
      type: NotificationType.FOLLOW_REQUEST,
    });

    await this.notificationService.sendNotification({
      userId: senderId,
      actorId: currentUserId,
      type: 'FOLLOW_REQUEST_ACCEPTED' as NotificationType,
    });

    return { success: true };
  }

  async declineFollowRequest(currentUserId: string, senderId: string) {
    await this.prisma.followRequest.deleteMany({
      where: { senderId, receiverId: currentUserId },
    });

    await this.notificationService.deleteNotificationForActor({
      userId: currentUserId,
      actorId: senderId,
      type: NotificationType.FOLLOW_REQUEST,
    });

    return { success: true };
  }

  private async createFollowRequest(senderId: string, receiverId: string) {
    const existingRequest = await this.prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: { senderId, receiverId },
      },
    });

    if (existingRequest) throw new BadRequestException('Request already sent');

    await this.prisma.followRequest.create({
      data: { senderId, receiverId },
    });

    await this.notificationService.sendNotification({
      userId: receiverId,
      actorId: senderId,
      type: NotificationType.FOLLOW_REQUEST,
    });

    return { success: true, status: 'requested' };
  }
}
