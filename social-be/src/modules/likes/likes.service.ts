import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SocketGateway } from '../socket/socket.gateway';
import { NotificationGateway } from '../socket/notification.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class LikesService {
  private readonly logger = new Logger(LikesService.name);

  constructor(
    private readonly prisma: PrismaService,
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
      this.notifySafely(data);
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

  private notifySafely(
    data: Parameters<NotificationsService['sendNotification']>[0],
  ) {
    void this.notificationService
      .sendNotification(data)
      .catch((error: unknown) => {
        this.logger.error(
          'Failed to create like notification',
          error instanceof Error ? error.stack : String(error),
        );
      });
  }
}
