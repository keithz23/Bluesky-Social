import { Injectable } from '@nestjs/common';
import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(currentUserId: string | null, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const parsedCursor = Number(query.cursor ?? 0);
    const offset =
      Number.isFinite(parsedCursor) && parsedCursor > 0 ? parsedCursor : 0;
    const seed = query.seed ?? `${Date.now()}`;
    const poolSize = Math.max(limit * 15, 300);

    let followingIds: string[] = [];
    let excludedUserIds: string[] = [];

    if (currentUserId) {
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
      followingIds = following.map((f) => f.followingId);
      excludedUserIds = [
        ...blocks.map((block) => block.blockedId),
        ...mutes.map((mute) => mute.mutedId),
      ];
    }

    const userIdFilter =
      excludedUserIds.length > 0
        ? {
            notIn: excludedUserIds,
          }
        : undefined;

    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
        parentPostId: null,
        ...(userIdFilter && { userId: userIdFilter }),
      },
      orderBy: { createdAt: 'desc' },
      take: poolSize,
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        viewCount: true,
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
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            mediaUrl: true,
            mediaType: true,
            width: true,
            height: true,
            altText: true,
          },
        },
      },
    });

    if (posts.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();
    let repostedSet = new Set<string>();
    const followingSet = new Set(followingIds);
    const now = Date.now();

    const rankedPosts = posts
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

    const pagePosts = rankedPosts.slice(offset, offset + limit);

    if (currentUserId) {
      const postIds = pagePosts.map((p) => p.id);

      const [likedPosts, bookmarkedPosts, repostedPosts] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
        }),
        this.prisma.repost.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
        }),
      ]);

      likedSet = new Set(likedPosts.map((l) => l.postId));
      bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
      repostedSet = new Set(repostedPosts.map((r) => r.postId));
    }

    const result = pagePosts.map((post) => ({
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
      },
    }));

    const nextOffset = offset + result.length;
    const hasMore = nextOffset < rankedPosts.length;
    const nextCursor = hasMore ? String(nextOffset) : null;

    return { posts: result, nextCursor, hasMore };
  }

  private seededRandom(input: string) {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0) / 4294967295;
  }

  create(createFeedDto: CreateFeedDto) {
    return 'This action adds a new feed';
  }

  findAll() {
    return `This action returns all feed`;
  }

  findOne(id: number) {
    return `This action returns a #${id} feed`;
  }

  update(id: number, updateFeedDto: UpdateFeedDto) {
    return `This action updates a #${id} feed`;
  }

  remove(id: number) {
    return `This action removes a #${id} feed`;
  }
}
