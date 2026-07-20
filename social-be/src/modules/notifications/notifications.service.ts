import { Injectable, OnModuleInit } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from '../socket/notification.gateway';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  onModuleInit() {}

  @OnEvent('notifications.get')
  async handleGetNotifications(payload: { userId: string; socketId?: string }) {
    const { userId } = payload;
    const [notifications, count] = await Promise.all([
      this.getNotifications(userId, {}),
      this.getUnreadCount(userId),
    ]);

    this.notificationGateway.emitToUserById(
      userId,
      'notifications:initial',
      notifications,
    );
    this.notificationGateway.emitToUserById(userId, 'unread-count', { count });
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

    const isOnline = await this.notificationGateway.isUserConnected(
      data.userId,
    );
    const duplicate = await this.findDuplicate(data);
    if (duplicate) return duplicate;

    const notification = await this.create({
      userId: data.userId,
      actorId: data.actorId,
      type: data.type,
      postId: data.postId,
    });

    if (isOnline) {
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
            displayName: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            followersCount: true,
            followingCount: true,
            postsCount: true,
            verified: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        },
      },
    });
  }

  async getNotifications(userId: string, query: NotificationQueryDto) {
    const limit = query.limit ?? 20;
    const cursorDate = query.cursor ? new Date(query.cursor) : null;
    const validCursor = cursorDate && !isNaN(cursorDate.getTime());

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        ...(validCursor && {
          createdAt: { lt: cursorDate },
        }),
        ...(query.filter === 'mention' && {
          type: NotificationType.MENTION,
        }),
      },
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        isRead: true,
        createdAt: true,
        postId: true,
        post: {
          select: {
            user: {
              select: {
                username: true,
              },
            },
          },
        },
        actor: {
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

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    const nextCursor = hasMore
      ? notifications[notifications.length - 1].createdAt.toISOString()
      : null;

    return { notifications, nextCursor, hasMore };
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

  async deleteNotificationForActor(data: {
    userId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
  }) {
    await this.prisma.notification.deleteMany({
      where: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
      },
    });

    const count = await this.getUnreadCount(data.userId);
    this.notificationGateway.emitToUserById(data.userId, 'unread-count', {
      count,
    });
  }

  async getUnreadCount(userId: string) {
    return await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
