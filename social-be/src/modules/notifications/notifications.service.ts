import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationGateway } from '../socket/notification.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}
  onModuleInit() {}

  @OnEvent('notifications.get')
  async handleGetNotifications(payload: { userId: string; socketId?: string }) {
    const { userId, socketId } = payload;
    const notifications = await this.getNotifications(userId);
    // emit về client qua gateway
    this.notificationGateway.emitToUserById(
      userId,
      'notifications:initial',
      notifications,
    );
  }

  @OnEvent('notifications.markRead')
  async handleMarkRead(payload: {
    userId: string;
    notificationId: string;
    socketId?: string;
  }) {
    const { userId, notificationId } = payload;
    await this.markAsRead(notificationId, userId);
    const count = await this.getUnreadCount(userId);
    this.notificationGateway.emitToUserById(userId, 'unread-count', { count });
  }

  @OnEvent('notifications.markAllRead')
  async handleMarkAllRead(payload: { userId: string; socketId?: string }) {
    const { userId } = payload;
    await this.markAllAsRead(userId);
    this.notificationGateway.emitToUserById(userId, 'unread-count', {
      count: 0,
    });
  }

  async sendNotification(data: {
    userId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
  }) {
    if (data.userId === data.actorId) return null;

    const duplicate = await this.findDuplicate(data);
    if (duplicate) return duplicate;

    const notification = await this.create({
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      postId: data.postId,
    });

    // Real-time emit if user connected
    if (this.notificationGateway.isUserConnected(data.userId)) {
      this.notificationGateway.emitToUserById(
        data.userId,
        'new-notification',
        notification,
      );
      const count = await this.getUnreadCount(data.userId);
      this.notificationGateway.emitToUserById(data.userId, 'unread-count', {
        count,
      });
    }

    return notification;
  }

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, postId, actorId, type } = createNotificationDto;
    return await this.prisma.notification.create({
      data: {
        userId,
        actorId,
        type,
        isRead: false,
        postId,
      },
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            followersCount: true,
            followingCount: true,
            postsCount: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });
  }

  async getNotifications(userId: string, cursor?: string, limit: number = 20) {
    const cursorDate = cursor ? new Date(cursor) : null;
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(cursorDate &&
          !isNaN(cursorDate.getTime()) && {
            createdAt: { gt: cursorDate },
          }),
      },
      take: limit + 1,
    });

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    const nextCursor = hasMore
      ? notifications[notifications.length - 1].createdAt.toISOString()
      : null;

    return {
      ...notifications,
      hasMore,
      nextCursor,
    };
  }

  async findDuplicate(data: {
    userId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
  }) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return await this.prisma.notification.findFirst({
      where: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
        createdAt: { gte: oneDayAgo },
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
