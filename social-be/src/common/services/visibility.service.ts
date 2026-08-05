import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VisibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async canViewUserContent(
    currentUserId: string,
    targetUser: { id: string; isPrivate: boolean },
  ) {
    if (targetUser.id === currentUserId) return true;
    if (!targetUser.isPrivate) return true;

    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUser.id,
        },
      },
      select: { id: true },
    });

    return Boolean(follow);
  }

  async getViewerContext(
    currentUserId: string | null,
    options: { includeBlockedBy?: boolean } = {},
  ) {
    if (!currentUserId) {
      return { followingIds: [], excludedUserIds: [] };
    }

    const [following, blocks, mutes, blockedBy] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      }),
      this.prisma.block.findMany({
        where: { blockerId: currentUserId },
        select: { blockedId: true },
      }),
      this.prisma.mute.findMany({
        where: { muterId: currentUserId },
        select: { mutedId: true },
      }),
      options.includeBlockedBy
        ? this.prisma.block.findMany({
            where: { blockedId: currentUserId },
            select: { blockerId: true },
          })
        : [],
    ]);

    return {
      followingIds: following.map((follow) => follow.followingId),
      excludedUserIds: [
        ...blocks.map((block) => block.blockedId),
        ...mutes.map((mute) => mute.mutedId),
        ...blockedBy.map((block) => block.blockerId),
      ],
    };
  }

  async getExcludedUserIds(
    currentUserId: string | null,
    options: { includeBlockedBy?: boolean } = {},
  ) {
    const { excludedUserIds } = await this.getViewerContext(
      currentUserId,
      options,
    );
    return excludedUserIds;
  }
}
