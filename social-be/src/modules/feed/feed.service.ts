import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';

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

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) { }

  async getFeed(currentUserId: string | null, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const offset = this.parseOffsetCursor(query.cursor);
    const seed = query.seed ?? `${Date.now()}`;

    const { followingIds, excludedUserIds } =
      await this.getViewerContext(currentUserId);

    if (currentUserId) {
      return this.getHybridFeed({
        currentUserId,
        followingIds,
        excludedUserIds,
        limit,
        offset,
        seed,
      });
    }

    const rankedPosts = await this.getRankedDiscoveryPosts({
      followingIds,
      excludedUserIds,
      seed,
      take: Math.max(limit * 15, 300),
    });

    return this.paginateAndFormat({
      currentUserId,
      followingIds,
      posts: rankedPosts,
      offset,
      limit,
    });
  }

  private async getHybridFeed({
    currentUserId,
    followingIds,
    excludedUserIds,
    limit,
    offset,
    seed,
  }: {
    currentUserId: string;
    followingIds: string[];
    excludedUserIds: string[];
    limit: number;
    offset: number;
    seed: string;
  }) {
    const poolSize = Math.max((offset + limit) * 5, 300);
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
      take: poolSize,
    });
    const rankedPosts = this.rankPosts(
      [...timelinePosts, ...discoveryPosts],
      followingIds,
      seed,
    );
    const posts = rankedPosts.slice(offset, offset + limit);
    const result = await this.formatPosts(
      posts,
      currentUserId,
      followingIds,
    );
    const nextOffset = offset + result.length;
    const hasMore = nextOffset < rankedPosts.length;

    return {
      posts: result,
      nextCursor: hasMore ? String(nextOffset) : null,
      hasMore,
    };
  }

  private async getViewerContext(currentUserId: string | null) {
    if (!currentUserId) {
      return { followingIds: [], excludedUserIds: [] };
    }

    const [following, blocks, mutes] = await Promise.all([
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
    ]);

    return {
      followingIds: following.map((f) => f.followingId),
      excludedUserIds: [
        ...blocks.map((block) => block.blockedId),
        ...mutes.map((mute) => mute.mutedId),
      ],
    };
  }

  private async getRankedDiscoveryPosts({
    followingIds,
    excludedUserIds,
    excludedPostIds = [],
    seed,
    take,
  }: {
    followingIds: string[];
    excludedUserIds: string[];
    excludedPostIds?: string[];
    seed: string;
    take: number;
  }) {
    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
        parentPostId: null,
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

    return this.rankPosts(posts, followingIds, seed);
  }

  private rankPosts(
    posts: FeedPost[],
    followingIds: string[],
    seed: string,
  ) {
    const uniquePosts = new Map<string, (typeof posts)[number]>();
    posts.forEach((post) => uniquePosts.set(post.id, post));

    const followingSet = new Set(followingIds);
    const now = Date.now();

    return [...uniquePosts.values()]
      .map((post) => {
        const ageHours = Math.max(
          0,
          (now - post.createdAt.getTime()) / (1000 * 60 * 60),
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
        return b.post.createdAt.getTime() - a.post.createdAt.getTime();
      })
      .map(({ post }) => post);
  }

  private async paginateAndFormat({
    currentUserId,
    followingIds,
    posts,
    offset,
    limit,
  }: {
    currentUserId: string | null;
    followingIds: string[];
    posts: FeedPost[];
    offset: number;
    limit: number;
  }) {
    const pagePosts = posts.slice(offset, offset + limit);
    const result = await this.formatPosts(
      pagePosts,
      currentUserId,
      followingIds,
    );
    const nextOffset = offset + result.length;
    const hasMore = nextOffset < posts.length;

    return {
      posts: result,
      nextCursor: hasMore ? String(nextOffset) : null,
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

  private parseOffsetCursor(cursor?: string) {
    const parsedCursor = Number(cursor ?? 0);
    return Number.isFinite(parsedCursor) && parsedCursor > 0
      ? parsedCursor
      : 0;
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
