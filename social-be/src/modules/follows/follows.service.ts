import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FollowQueryDto } from './dto/follow-query.dto';

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const [follow] = await this.prisma.$transaction([
      this.prisma.follow.create({
        data: { followerId, followingId },
      }),
      // Increase the following count of the follower.
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { increment: 1 } },
      }),
      // Increase the followers count of the user being followed.
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

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
      // Decrease the following count of the follower.
      this.prisma.user.update({
        where: { id: followerId },
        data: { followingCount: { decrement: 1 } },
      }),
      // Decrease the followers count of the user being unfollowed.
      this.prisma.user.update({
        where: { id: followingId },
        data: { followersCount: { decrement: 1 } },
      }),
    ]);

    return { success: true, status: 'unfollowed' };
  }

  // For private accounts
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

    return { success: true, status: 'requested' };
  }

  // Accept follow request (for private accounts)
  async acceptFollowRequest(currentUserId: string, senderId: string) {
    const request = await this.prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: { senderId, receiverId: currentUserId },
      },
    });

    if (!request) throw new NotFoundException('Follow request not found');

    await this.prisma.$transaction([
      // Delete the follow request
      this.prisma.followRequest.delete({
        where: {
          senderId_receiverId: { senderId, receiverId: currentUserId },
        },
      }),
      // Create the actual follow relationship
      this.prisma.follow.create({
        data: { followerId: senderId, followingId: currentUserId },
      }),
      // Increase following count of the sender
      this.prisma.user.update({
        where: { id: senderId },
        data: { followingCount: { increment: 1 } },
      }),
      // Increase followers count of the current user
      this.prisma.user.update({
        where: { id: currentUserId },
        data: { followersCount: { increment: 1 } },
      }),
    ]);

    return { success: true };
  }

  // Decline or cancel follow request
  async declineFollowRequest(currentUserId: string, senderId: string) {
    await this.prisma.followRequest.deleteMany({
      where: { senderId, receiverId: currentUserId },
    });

    return { success: true };
  }

  // Check follow status between two users
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

  async getFollowingLists(query: FollowQueryDto) {
    const limit = query.limit ?? 20;
    const username = query.username;

    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });

    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: user?.id,
      },
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            bio: true,
            avatarUrl: true,
            coverUrl: true,
            verified: true,
          },
        },
      },
    });

    const hasMore = follows.length > limit;
    if (hasMore) follows.pop();

    const nextCursor = hasMore ? follows[follows.length - 1].id : null;

    const formattedFollowing = follows.map((f) => ({
      followId: f.id,
      followedAt: f.createdAt,
      ...f.following,
    }));

    return {
      following: formattedFollowing,
      nextCursor,
      hasMore,
    };
  }

  async getFollowerLists(query: FollowQueryDto) {
    const limit = query.limit ?? 20;
    const username = query.username;
    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true },
    });

    const follows = await this.prisma.follow.findMany({
      where: {
        followingId: user?.id,
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
            avatarUrl: true,
            coverUrl: true,
          },
        },
      },
    });

    const hasMore = follows.length > limit;
    if (hasMore) follows.pop();

    const nextCursor = hasMore ? follows[follows.length - 1].id : null;

    const formattedFollowers = follows.map((f) => ({
      followerId: f.id,
      followerAt: f.createdAt,
      ...f.follower,
    }));

    return {
      follower: formattedFollowers,
      nextCursor,
      hasMore,
    };
  }
}
