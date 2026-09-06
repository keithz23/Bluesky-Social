import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { VisibilityService } from 'src/common/services/visibility.service';
import { FeedQueryDto } from './dto/requests/feed-query.dto';
import { isSystemFeedSlug, SYSTEM_FEEDS } from './feed-catalog';
import { FeedCursor, FeedPost } from './services/feed.types';
import { FeedPostPresenterService } from './services/feed-post-presenter.service';
import { FeedRankingService } from './services/feed-ranking.service';

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
    private readonly presenter: FeedPostPresenterService,
    private readonly ranking: FeedRankingService,
  ) {}

  async getFeed(currentUserId: string | null, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = this.ranking.decodeCursor(query.cursor);
    const seed = cursor?.seed ?? query.seed ?? `${Date.now()}`;
    const rankedAt = cursor?.rankedAt ?? Date.now();

    const { followingIds, excludedUserIds } =
      await this.visibility.getViewerContext(currentUserId, {
        includeBlockedBy: true,
      });

    if (currentUserId) {
      return this.getHybridFeed({
        currentUserId,
        followingIds,
        excludedUserIds,
        limit,
        cursor,
        seed,
        rankedAt,
      });
    }

    const rankedPosts = await this.getRankedDiscoveryPosts({
      followingIds,
      excludedUserIds,
      seed,
      rankedAt,
      take: this.ranking.getRankedPoolSize(cursor, limit),
    });

    return this.ranking.paginateRankedAndFormat({
      currentUserId,
      followingIds,
      rankedPosts,
      cursor,
      limit,
      seed,
      rankedAt,
    });
  }

  async getCatalog(currentUserId: string | null) {
    const pinned = currentUserId
      ? await this.prisma.userPinnedFeed.findMany({
          where: { userId: currentUserId },
          orderBy: { position: 'asc' },
          select: { feedSlug: true },
        })
      : [];
    const pinnedSet = new Set(pinned.map((item) => item.feedSlug));
    return SYSTEM_FEEDS.map((feed) => ({
      ...feed,
      isPinned: pinnedSet.has(feed.slug),
    }));
  }

  async getPinnedFeeds(userId: string) {
    const catalog = await this.getCatalog(userId);
    return catalog.filter((feed) => feed.isPinned);
  }

  async pinFeed(userId: string, slug: string) {
    if (!isSystemFeedSlug(slug)) throw new NotFoundException('Feed not found');
    const last = await this.prisma.userPinnedFeed.aggregate({
      where: { userId },
      _max: { position: true },
    });
    await this.prisma.userPinnedFeed.upsert({
      where: { userId_feedSlug: { userId, feedSlug: slug } },
      create: {
        userId,
        feedSlug: slug,
        position: (last._max.position ?? -1) + 1,
      },
      update: {},
    });
    return { slug, isPinned: true };
  }

  async unpinFeed(userId: string, slug: string) {
    if (!isSystemFeedSlug(slug)) throw new NotFoundException('Feed not found');
    await this.prisma.userPinnedFeed.deleteMany({
      where: { userId, feedSlug: slug },
    });
    return { slug, isPinned: false };
  }

  async getSystemFeed(
    slug: string,
    currentUserId: string | null,
    query: FeedQueryDto,
  ) {
    if (!isSystemFeedSlug(slug)) throw new NotFoundException('Feed not found');
    if (slug === 'discover') return this.getFeed(currentUserId, query);

    const limit = query.limit ?? 20;
    const cursor = this.ranking.decodeCursor(query.cursor);
    const seed = cursor?.seed ?? query.seed ?? `${Date.now()}`;
    const rankedAt = cursor?.rankedAt ?? Date.now();
    const { followingIds, excludedUserIds } =
      await this.visibility.getViewerContext(currentUserId, {
        includeBlockedBy: true,
      });

    const createdAtCursor =
      slug === 'following' && cursor?.mode === 'createdAt' ? cursor : null;

    const where: Prisma.PostWhereInput = {
      isDeleted: false,
      autoFlagged: false,
      parentPostId: null,
      ...(slug !== 'following' && {
        OR: [
          { user: { isPrivate: false } },
          ...(followingIds.length > 0
            ? [{ userId: { in: followingIds } }]
            : []),
        ],
      }),
      ...(excludedUserIds.length > 0 && { userId: { notIn: excludedUserIds } }),
      ...(slug === 'following' && {
        userId: { in: currentUserId ? [...followingIds, currentUserId] : [] },
      }),
      ...(slug === 'media' && {
        media: { some: { mediaType: { in: ['IMAGE', 'GIF'] } } },
      }),
      ...(slug === 'video' && { media: { some: { mediaType: 'VIDEO' } } }),
      ...(createdAtCursor && {
        OR: [
          { createdAt: { lt: new Date(createdAtCursor.createdAt) } },
          {
            createdAt: new Date(createdAtCursor.createdAt),
            id: { lt: createdAtCursor.id },
          },
        ],
      }),
    };

    const candidates = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take:
        slug === 'following'
          ? limit + 1
          : this.ranking.getRankedPoolSize(cursor, limit),
      select: this.presenter.getPostSelect(),
    });

    if (slug === 'following') {
      return this.ranking.paginateCreatedAtAndFormat({
        currentUserId,
        followingIds,
        posts: candidates,
        limit,
        seed,
        rankedAt,
        seen: cursor?.mode === 'createdAt' ? cursor.seen : 0,
      });
    }

    const rankedPosts = this.ranking.rankPosts(
      candidates,
      followingIds,
      seed,
      rankedAt,
    );
    return this.ranking.paginateRankedAndFormat({
      currentUserId,
      followingIds,
      rankedPosts,
      cursor,
      limit,
      seed,
      rankedAt,
    });
  }

  private async getHybridFeed({
    currentUserId,
    followingIds,
    excludedUserIds,
    limit,
    cursor,
    seed,
    rankedAt,
  }: {
    currentUserId: string;
    followingIds: string[];
    excludedUserIds: string[];
    limit: number;
    cursor: FeedCursor | null;
    seed: string;
    rankedAt: number;
  }) {
    const poolSize = this.ranking.getRankedPoolSize(cursor, limit);
    const timelineWhere = {
      userId: currentUserId,
      post: {
        isDeleted: false,
        parentPostId: null,
        ...(excludedUserIds.length > 0 && {
          userId: { notIn: excludedUserIds },
        }),
      },
    };

    const timelineRows = await this.prisma.homeTimeline.findMany({
      where: timelineWhere,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: poolSize,
      select: {
        post: {
          select: this.presenter.getPostSelect(),
        },
      },
    });
    const timelinePosts = timelineRows.map((row) => row.post);
    const discoveryPosts = await this.getRankedDiscoveryPosts({
      followingIds,
      excludedUserIds,
      excludedPostIds: timelinePosts.map((post) => post.id),
      seed,
      rankedAt,
      take: poolSize,
    });
    const rankedPosts = this.ranking.rankPosts(
      [...timelinePosts, ...discoveryPosts],
      followingIds,
      seed,
      rankedAt,
    );
    return this.ranking.paginateRankedAndFormat({
      currentUserId,
      followingIds,
      rankedPosts,
      cursor,
      limit,
      seed,
      rankedAt,
    });
  }

  private async getRankedDiscoveryPosts({
    followingIds,
    excludedUserIds,
    excludedPostIds = [],
    seed,
    rankedAt,
    take,
  }: {
    followingIds: string[];
    excludedUserIds: string[];
    excludedPostIds?: string[];
    seed: string;
    rankedAt: number;
    take: number;
  }) {
    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
        autoFlagged: false,
        parentPostId: null,
        OR: [
          { user: { isPrivate: false } },
          ...(followingIds.length > 0
            ? [{ userId: { in: followingIds } }]
            : []),
        ],
        ...(excludedUserIds.length > 0 && {
          userId: { notIn: excludedUserIds },
        }),
        ...(excludedPostIds.length > 0 && {
          id: { notIn: excludedPostIds },
        }),
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: this.presenter.getPostSelect(),
    });

    return this.ranking.rankPosts(posts, followingIds, seed, rankedAt);
  }
}
