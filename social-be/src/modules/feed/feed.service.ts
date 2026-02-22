import { Injectable } from '@nestjs/common';
import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedQueryDto } from './dto/feed-query.dto';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(currentUserId: string, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const following = await this.prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const posts = await this.prisma.post.findMany({
      where: {
        userId: { in: followingIds },
        isDeleted: false,
        parentPostId: null,
        ...(query.cursor && {
          id: { lt: query.cursor },
        }),
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
        // Author info
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
        // Get media (image/gif), sort by orderIndex
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

    const followingSet = new Set(followingIds);

    const [likedPosts, bookmarkedPosts, repostedPosts] = await Promise.all([
      this.prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map((p) => p.id) },
        },
      }),

      this.prisma.bookmark.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map((p) => p.id) },
        },
      }),

      this.prisma.repost.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map((p) => p.id) },
        },
      }),
    ]);

    const likedSet = new Set(likedPosts.map((l) => l.postId));

    const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));

    const repostedSet = new Set(repostedPosts.map((r) => r.postId));

    const result = posts.map((post) => ({
      ...post,
      isLiked: likedSet.has(post.id),
      isBookmarked: bookmarkedSet.has(post.id),
      isReposted: repostedSet.has(post.id),
      user: {
        ...post.user,
        followStatus:
          post.user.id === currentUserId
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
