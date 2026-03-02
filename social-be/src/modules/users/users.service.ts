import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchUserDto } from './dto/search-user.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(username: string, currentUserId: string) {
    const user = await this.prisma.user.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        verified: true,
        isPrivate: true,
        createdAt: true,
        followersCount: true,
        followingCount: true,
        postsCount: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.id === currentUserId) {
      return { ...user, followStatus: null, isOwner: true };
    }

    const [follow, request] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id,
          },
        },
      }),
      this.prisma.followRequest.findUnique({
        where: {
          senderId_receiverId: {
            senderId: currentUserId,
            receiverId: user.id,
          },
        },
      }),
    ]);

    const followStatus = follow ? 'following' : request ? 'requested' : 'none';

    return { ...user, followStatus, isOwner: false };
  }

  async searchUser(userId: string, searchUserDto: SearchUserDto) {
    const { q, limit = 10 } = searchUserDto;

    const users = await this.prisma.$queryRaw<User[]>`
      SELECT 
        id, username, bio,
        avatar_url AS "avatarUrl",
        cover_url AS "coverUrl"
      FROM users
      WHERE username ILIKE ${`%${q}%`}
      AND id != ${userId}
      ORDER BY
        CASE WHEN username ILIKE ${`${q}%`} THEN 0 ELSE 1 END
      LIMIT ${Prisma.sql`${limit}::int`}
    `;

    return users;
  }
}
