import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FeedPost } from './feed.types';

@Injectable()
export class FeedPostPresenterService {
  constructor(private readonly prisma: PrismaService) {}

  getPostSelect() {
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

  async formatPosts(
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
}
