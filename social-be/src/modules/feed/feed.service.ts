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

    let followingIds: string[] = [];

    if (currentUserId) {
      const following = await this.prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      followingIds = following.map((f) => f.followingId);
    }

    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
        parentPostId: null,
        ...(followingIds.length > 0 && { userId: { in: followingIds } }),
        ...(query.cursor && { id: { lt: query.cursor } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        user: {
          select: {
            id: true,
            username: true,
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

    if (currentUserId) {
      const postIds = posts.map((p) => p.id);

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

    const result = posts.map((post) => ({
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

    const hasMore = result.length > limit;
    if (hasMore) result.pop();
    const nextCursor = hasMore ? result[result.length - 1].id : null;

    return { posts: result, nextCursor, hasMore };
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
