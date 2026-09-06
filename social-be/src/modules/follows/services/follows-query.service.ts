import { Injectable, NotFoundException } from '@nestjs/common';
import { FollowRequestStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { FollowQueryDto } from '../dto/requests/follow-query.dto';
import { FollowRequestQueryDto } from '../dto/requests/follow-request-query.dto';

@Injectable()
export class FollowsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async getFollowStatus(currentUserId: string, targetUserId: string) {
    const [follow, request] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
      }),
      this.prisma.followRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: currentUserId,
            receiverId: targetUserId,
          },
        },
      }),
    ]);

    if (follow) return { status: 'following' };
    if (request) return { status: 'requested' };
    return { status: 'none' };
  }

  async getFollowingLists(currentUserId: string, query: FollowQueryDto) {
    const limit = query.limit ?? 20;
    const username = query.username;
    const listId = query.listId;

    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true, isPrivate: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.canViewUserConnections(currentUserId, user))) {
      return { following: [], nextCursor: null, hasMore: false };
    }

    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: user.id,
      },
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            verified: true,
            ...(listId && {
              listMembers: {
                where: { listId: listId },
                select: { id: true },
              },
            }),
          },
        },
      },
    });

    const hasMore = follows.length > limit;
    if (hasMore) follows.pop();

    const nextCursor = hasMore ? follows[follows.length - 1].id : null;

    const formattedFollowing = follows.map((follow) => {
      const { listMembers, ...userData } = follow.following as any;

      return {
        followId: follow.id,
        followedAt: follow.createdAt,
        ...userData,
        isAdded: listId ? listMembers && listMembers.length > 0 : false,
      };
    });

    return {
      following: formattedFollowing,
      nextCursor,
      hasMore,
    };
  }

  async getFollowerLists(currentUserId: string, query: FollowQueryDto) {
    const limit = query.limit ?? 20;
    const username = query.username;
    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true, isPrivate: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await this.canViewUserConnections(currentUserId, user))) {
      return { follower: [], nextCursor: null, hasMore: false };
    }

    const follows = await this.prisma.follow.findMany({
      where: {
        followingId: user.id,
      },
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            bio: true,
            verified: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
          },
        },
      },
    });

    const hasMore = follows.length > limit;
    if (hasMore) follows.pop();

    const nextCursor = hasMore ? follows[follows.length - 1].id : null;

    const formattedFollowers = follows.map((follow) => ({
      followerId: follow.id,
      followerAt: follow.createdAt,
      ...follow.follower,
    }));

    return {
      follower: formattedFollowers,
      nextCursor,
      hasMore,
    };
  }

  async getReceivedFollowRequests(
    userId: string,
    query: FollowRequestQueryDto,
  ) {
    const limit = query.limit ?? 20;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const followRequests = await this.prisma.followRequest.findMany({
      where: {
        receiverId: userId,
        status: FollowRequestStatus.PENDING,
      },
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
            bio: true,
            verified: true,
          },
        },
      },
    });

    const hasMore = followRequests.length > limit;
    if (hasMore) followRequests.pop();
    const nextCursor = hasMore
      ? followRequests[followRequests.length - 1].id
      : null;

    return {
      receivedFollow: followRequests.map((request) => ({
        requestId: request.id,
        requestedAt: request.createdAt,
        ...request.sender,
      })),
      nextCursor,
      hasMore,
    };
  }

  private async canViewUserConnections(
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
}
