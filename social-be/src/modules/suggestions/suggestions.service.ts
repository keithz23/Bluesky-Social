import { Injectable } from '@nestjs/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { UpdateSuggestionDto } from './dto/update-suggestion.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuggestedUsers(currentUserId: string, limit = 10) {
    // Get users that the current user is already following
    // and users that have pending follow requests
    const [following, requested] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      }),

      this.prisma.followRequest.findMany({
        where: { senderId: currentUserId },
        select: { receiverId: true },
      }),
    ]);

    // Collect IDs to exclude:
    // - The current user
    // - Users already followed
    // - Users with pending follow requests
    const excludeIds = [
      currentUserId,
      ...following.map((f) => f.followingId),
      ...requested.map((r) => r.receiverId),
    ];

    const users = await this.prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },

        // Do not suggest users who have blocked the current user
        // or users that the current user has blocked
        blocking: { none: { blockedId: currentUserId } },
        blockedBy: { none: { blockerId: currentUserId } },
      },

      // Order by popularity (most followers first)
      orderBy: { followersCount: 'desc' },

      take: limit,

      select: {
        id: true,
        username: true,
        avatarUrl: true,
        verified: true,
        followersCount: true,
        bio: true,
      },
    });

    return users;
  }

  create(createSuggestionDto: CreateSuggestionDto) {
    return 'This action adds a new suggestion';
  }

  findAll() {
    return `This action returns all suggestions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} suggestion`;
  }

  update(id: number, updateSuggestionDto: UpdateSuggestionDto) {
    return `This action updates a #${id} suggestion`;
  }

  remove(id: number) {
    return `This action removes a #${id} suggestion`;
  }
}
