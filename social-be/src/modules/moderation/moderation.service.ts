import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportPostDto } from './dto/report-post.dto';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async blockUser(blockerId: string, blockedId: string) {
    await this.ensureTargetUser(blockerId, blockedId);

    const block = await this.prisma.$transaction(async (tx) => {
      const createdBlock = await tx.block.upsert({
        where: { blockerId_blockedId: { blockerId, blockedId } },
        create: { blockerId, blockedId },
        update: {},
      });

      const follows = await tx.follow.findMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
        select: { followerId: true, followingId: true },
      });

      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });

      await tx.homeTimeline.deleteMany({
        where: {
          OR: [
            { userId: blockerId, authorId: blockedId },
            { userId: blockedId, authorId: blockerId },
          ],
        },
      });

      await Promise.all(
        follows.flatMap((follow) => [
          tx.user.update({
            where: { id: follow.followerId },
            data: { followingCount: { decrement: 1 } },
          }),
          tx.user.update({
            where: { id: follow.followingId },
            data: { followersCount: { decrement: 1 } },
          }),
        ]),
      );

      return createdBlock;
    });

    return { blocked: true, userId: block.blockedId };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });

    return { blocked: false, userId: blockedId };
  }

  async muteUser(muterId: string, mutedId: string) {
    await this.ensureTargetUser(muterId, mutedId);

    const mute = await this.prisma.mute.upsert({
      where: { muterId_mutedId: { muterId, mutedId } },
      create: { muterId, mutedId },
      update: {},
    });

    await this.prisma.homeTimeline.deleteMany({
      where: { userId: muterId, authorId: mutedId },
    });

    return { muted: true, userId: mute.mutedId };
  }

  async unmuteUser(muterId: string, mutedId: string) {
    await this.prisma.mute.deleteMany({
      where: { muterId, mutedId },
    });

    return { muted: false, userId: mutedId };
  }

  async reportPost(reporterId: string, postId: string, dto: ReportPostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: { id: true, userId: true },
    });

    if (!post) throw new NotFoundException('Post not found');
    if (post.userId === reporterId) {
      throw new BadRequestException('You cannot report your own post');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        postId,
        userId: post.userId,
        reason: dto.reason,
        details: dto.details,
      },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });

    return { reported: true, report };
  }

  private async ensureTargetUser(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'You cannot perform this action on yourself',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) throw new NotFoundException('User not found');
  }
}
