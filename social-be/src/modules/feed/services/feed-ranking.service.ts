import { Injectable } from '@nestjs/common';
import { FeedPost, RankedFeedPost, FeedCursor } from './feed.types';
import { FeedPostPresenterService } from './feed-post-presenter.service';

@Injectable()
export class FeedRankingService {
  constructor(private readonly presenter: FeedPostPresenterService) {}

  rankPosts(
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

  async paginateRankedAndFormat({
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
    const result = await this.presenter.formatPosts(
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

  async paginateCreatedAtAndFormat({
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

    const result = await this.presenter.formatPosts(
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

  getRankedPoolSize(cursor: FeedCursor | null, limit: number) {
    return Math.max(((cursor?.seen ?? 0) + limit) * 5, 300);
  }

  encodeCursor(cursor: FeedCursor) {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  decodeCursor(cursor?: string): FeedCursor | null {
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

  private toFeedPost(item: FeedPost | RankedFeedPost): FeedPost {
    return this.isRankedFeedPost(item) ? item.post : item;
  }

  private isRankedFeedPost(
    item: FeedPost | RankedFeedPost,
  ): item is RankedFeedPost {
    return 'post' in item && 'score' in item;
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

  private seededRandom(input: string) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) / 4294967295;
  }
}
