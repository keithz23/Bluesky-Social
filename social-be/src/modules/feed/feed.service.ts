import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { VisibilityService } from 'src/common/services/visibility.service';
import { FeedQueryDto } from './dto/feed-query.dto';
import { isSystemFeedSlug, SYSTEM_FEEDS } from './feed-catalog';

type FeedPost = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  bookmarkCount: number;
  viewCount: number;
  user: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type RankedFeedPost = {
  post: FeedPost;
  score: number;
};

type FeedCursor = {
  v: 1;
  mode: 'ranked' | 'createdAt';
  seed: string;
  rankedAt: number;
  seen: number;
  id: string;
  createdAt: string;
  score?: number;
};

@Injectable()
export class FeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  async getFeed(currentUserId: string | null, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = this.decodeCursor(query.cursor);
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
      take: this.getRankedPoolSize(cursor, limit),
    });

    return this.paginateRankedAndFormat({
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
    const cursor = this.decodeCursor(query.cursor);
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
          : this.getRankedPoolSize(cursor, limit),
      select: this.getPostSelect(),
    });

    if (slug === 'following') {
      return this.paginateCreatedAtAndFormat({
        currentUserId,
        followingIds,
        posts: candidates,
        limit,
        seed,
        rankedAt,
        seen: cursor?.mode === 'createdAt' ? cursor.seen : 0,
      });
    }

    const rankedPosts = this.rankPosts(
      candidates,
      followingIds,
      seed,
      rankedAt,
    );
    return this.paginateRankedAndFormat({
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
    const poolSize = this.getRankedPoolSize(cursor, limit);
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
          select: this.getPostSelect(),
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
    const rankedPosts = this.rankPosts(
      [...timelinePosts, ...discoveryPosts],
      followingIds,
      seed,
      rankedAt,
    );
    return this.paginateRankedAndFormat({
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
      select: this.getPostSelect(),
    });

    return this.rankPosts(posts, followingIds, seed, rankedAt);
  }

  private rankPosts(
    posts: Array<FeedPost | RankedFeedPost>,
    followingIds: string[],
    seed: string,
    rankedAt: number,
  ) {
    const uniquePosts = new Map<string, FeedPost>();
    posts.forEach((item) => {
      const post = this.toFeedPost(item);
      uniquePosts.set(post.id, post);
    });

    const followingSet = new Set(followingIds);

    return [...uniquePosts.values()]
      .map((item) => {
        const post = this.toFeedPost(item);
        const ageHours = Math.max(
          0,
          (rankedAt - post.createdAt.getTime()) / (1000 * 60 * 60),
        );
        const freshnessScore = Math.max(0, 120 - ageHours * 1.5);
        const engagementScore =
          post.likeCount * 3 +
          post.replyCount * 5 +
          post.repostCount * 6 +
          post.bookmarkCount * 4 +
          post.viewCount * 0.2;
        const followingBoost = followingSet.has(post.user.id) ? 25 : 0;
        const randomBoost = this.seededRandom(`${seed}:${post.id}`) * 70;

        return {
          post,
          score:
            freshnessScore + engagementScore + followingBoost + randomBoost,
        };
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const createdDiff =
          b.post.createdAt.getTime() - a.post.createdAt.getTime();
        if (createdDiff !== 0) return createdDiff;
        return b.post.id.localeCompare(a.post.id);
      });
  }

  private toFeedPost(item: FeedPost | RankedFeedPost): FeedPost {
    return this.isRankedFeedPost(item) ? item.post : item;
  }

  private isRankedFeedPost(
    item: FeedPost | RankedFeedPost,
  ): item is RankedFeedPost {
    return 'post' in item && 'score' in item;
  }

  private async paginateRankedAndFormat({
    currentUserId,
    followingIds,
    rankedPosts,
    cursor,
    limit,
    seed,
    rankedAt,
  }: {
    currentUserId: string | null;
    followingIds: string[];
    rankedPosts: RankedFeedPost[];
    cursor: FeedCursor | null;
    limit: number;
    seed: string;
    rankedAt: number;
  }) {
    const afterCursor =
      cursor?.mode === 'ranked'
        ? rankedPosts.filter((item) => this.isAfterRankedCursor(item, cursor))
        : rankedPosts;
    const pageItems = afterCursor.slice(0, limit + 1);
    const hasMore = pageItems.length > limit;
    if (hasMore) pageItems.pop();

    const pagePosts = pageItems.map((item) => item.post);
    const result = await this.formatPosts(
      pagePosts,
      currentUserId,
      followingIds,
    );
    const lastItem = pageItems[pageItems.length - 1];

    return {
      posts: result,
      nextCursor:
        hasMore && lastItem
          ? this.encodeCursor({
              v: 1,
              mode: 'ranked',
              seed,
              rankedAt,
              seen: (cursor?.seen ?? 0) + result.length,
              id: lastItem.post.id,
              createdAt: lastItem.post.createdAt.toISOString(),
              score: lastItem.score,
            })
          : null,
      hasMore,
    };
  }

  private async paginateCreatedAtAndFormat({
    currentUserId,
    followingIds,
    posts,
    limit,
    seed,
    rankedAt,
    seen,
  }: {
    currentUserId: string | null;
    followingIds: string[];
    posts: FeedPost[];
    limit: number;
    seed: string;
    rankedAt: number;
    seen: number;
  }) {
    const pagePosts = posts.slice(0, limit + 1);
    const hasMore = pagePosts.length > limit;
    if (hasMore) pagePosts.pop();

    const result = await this.formatPosts(
      pagePosts,
      currentUserId,
      followingIds,
    );
    const lastPost = pagePosts[pagePosts.length - 1];

    return {
      posts: result,
      nextCursor:
        hasMore && lastPost
          ? this.encodeCursor({
              v: 1,
              mode: 'createdAt',
              seed,
              rankedAt,
              seen: seen + result.length,
              id: lastPost.id,
              createdAt: lastPost.createdAt.toISOString(),
            })
          : null,
      hasMore,
    };
  }

  private async formatPosts(
    posts: FeedPost[],
    currentUserId: string | null,
    followingIds: string[],
  ) {
    if (posts.length === 0) return [];

    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();
    let repostedSet = new Set<string>();
    let authorFollowsMeSet = new Set<string>();
    const followingSet = new Set(followingIds);

    if (currentUserId) {
      const postIds = posts.map((post) => post.id);
      const authorIds = [...new Set(posts.map((post) => post.user.id))];

      const [likedPosts, bookmarkedPosts, repostedPosts, authorFollowsMe] =
        await Promise.all([
          this.prisma.like.findMany({
            where: { userId: currentUserId, postId: { in: postIds } },
          }),
          this.prisma.bookmark.findMany({
            where: { userId: currentUserId, postId: { in: postIds } },
          }),
          this.prisma.repost.findMany({
            where: { userId: currentUserId, postId: { in: postIds } },
          }),
          this.prisma.follow.findMany({
            where: {
              followerId: { in: authorIds },
              followingId: currentUserId,
            },
            select: { followerId: true },
          }),
        ]);

      likedSet = new Set(likedPosts.map((like) => like.postId));
      bookmarkedSet = new Set(
        bookmarkedPosts.map((bookmark) => bookmark.postId),
      );
      repostedSet = new Set(repostedPosts.map((repost) => repost.postId));
      authorFollowsMeSet = new Set(
        authorFollowsMe.map((follow) => follow.followerId),
      );
    }

    return posts.map((post) => ({
      ...post,
      isLiked: likedSet.has(post.id),
      isBookmarked: bookmarkedSet.has(post.id),
      isReposted: repostedSet.has(post.id),
      user: {
        ...post.user,
        followStatus: !currentUserId
          ? 'none'
          : post.user.id === currentUserId
            ? null
            : followingSet.has(post.user.id)
              ? 'following'
              : 'none',
        isFollowedByAuthor: currentUserId
          ? authorFollowsMeSet.has(post.user.id)
          : false,
      },
    }));
  }

  private getPostSelect() {
    return {
      id: true,
      content: true,
      createdAt: true,
      likeCount: true,
      replyCount: true,
      repostCount: true,
      bookmarkCount: true,
      viewCount: true,
      replyPolicy: true,
      replyFollowers: true,
      replyFollowing: true,
      replyMentioned: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          verified: true,
          followersCount: true,
          followingCount: true,
          bio: true,
        },
      },
      media: {
        orderBy: { orderIndex: 'asc' as const },
        select: {
          id: true,
          mediaUrl: true,
          mediaType: true,
          width: true,
          height: true,
          altText: true,
        },
      },
    };
  }

  private getRankedPoolSize(cursor: FeedCursor | null, limit: number) {
    return Math.max(((cursor?.seen ?? 0) + limit) * 5, 300);
  }

  private isAfterRankedCursor(item: RankedFeedPost, cursor: FeedCursor) {
    if (cursor.score === undefined) return true;
    if (item.score !== cursor.score) return item.score < cursor.score;

    const cursorCreatedAt = new Date(cursor.createdAt).getTime();
    const itemCreatedAt = item.post.createdAt.getTime();
    if (itemCreatedAt !== cursorCreatedAt) {
      return itemCreatedAt < cursorCreatedAt;
    }

    return item.post.id < cursor.id;
  }

  private encodeCursor(cursor: FeedCursor) {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private decodeCursor(cursor?: string): FeedCursor | null {
    if (!cursor) return null;

    try {
      const parsed = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as FeedCursor;

      if (
        parsed?.v === 1 &&
        (parsed.mode === 'ranked' || parsed.mode === 'createdAt') &&
        typeof parsed.id === 'string' &&
        typeof parsed.createdAt === 'string'
      ) {
        return parsed;
      }
    } catch {
      return null;
    }

    return null;
  }

  private seededRandom(input: string) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) / 4294967295;
  }
}
