import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
