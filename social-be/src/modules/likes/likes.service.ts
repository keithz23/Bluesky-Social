import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationGateway } from '../socket/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationsService,
  ) {}

  async like(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) throw new BadRequestException('Already liked');

    await this.prisma.$transaction([
      this.prisma.like.create({
        data: { userId, postId },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);

    const post = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: { userId: true },
    });

    if (post && post.userId !== userId) {
      const data = {
        type: NotificationType.LIKE,
        postId,
        actorId: userId,
        userId: post.userId,
      };
      this.notificationService.sendNotification(data);
    }

    return { liked: true };
  }

  async unLike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) throw new BadRequestException('Not liked yet');

    await this.prisma.$transaction([
      this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    return { liked: false };
  }
}
