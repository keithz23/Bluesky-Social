import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VisibilityService } from 'src/common/services/visibility.service';
import { SYSTEM_FEEDS } from '../feed/feed-catalog';
import { ExploreQueryDto } from './dto/explore-query.dto';

@Injectable()
export class ExploreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  async getExplore(currentUserId: string | null, query: ExploreQueryDto) {
    const q = query.q?.trim();
    const limit = query.limit ?? 10;
    const excludedUserIds = await this.visibility.getExcludedUserIds(
      currentUserId,
      { includeBlockedBy: true },
    );
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [hashtags, accounts] = await Promise.all([
      this.prisma.hashtag.findMany({
        where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
        orderBy: { postCount: 'desc' },
        take: limit * 3,
        select: {
          id: true,
          name: true,
          postCount: true,
          posts: {
            where: {
              createdAt: { gte: since },
              post: {
                isDeleted: false,
                autoFlagged: false,
                user: { isPrivate: false },
                ...(excludedUserIds.length > 0 && {
                  userId: { notIn: excludedUserIds },
                }),
              },
            },
            select: { postId: true },
            take: 100,
          },
        },
      }),
      this.prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          isPrivate: false,
          ...(currentUserId && { id: { not: currentUserId } }),
          ...(excludedUserIds.length > 0 && { id: { notIn: excludedUserIds } }),
          ...(q && {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
              { bio: { contains: q, mode: 'insensitive' } },
            ],
          }),
        },
        orderBy: [{ followersCount: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          verified: true,
          followersCount: true,
        },
      }),
    ]);

    const topics = hashtags
      .map(({ posts, ...hashtag }) => ({
        ...hashtag,
        recentPostCount: posts.length,
        score: posts.length * 5 + hashtag.postCount,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    const normalizedQuery = q?.toLowerCase();
    const feeds = SYSTEM_FEEDS.filter(
      (feed) =>
        !normalizedQuery ||
        feed.name.toLowerCase().includes(normalizedQuery) ||
        feed.description.toLowerCase().includes(normalizedQuery),
    );

    return { topics, accounts, feeds };
  }
}
