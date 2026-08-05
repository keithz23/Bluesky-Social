import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

type PostWithAuthor = {
  id: string;
  user: {
    id: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

@Injectable()
export class PostFormatterService {
  constructor(private readonly prisma: PrismaService) {}

  async enrichPosts<T extends PostWithAuthor>(
    currentUserId: string,
    posts: T[],
    options: { includeAuthorFollowsMe?: boolean } = {},
  ) {
    if (posts.length === 0) return [];

    const postIds = posts.map((post) => post.id);
    const authorIds = [...new Set(posts.map((post) => post.user.id))];

    const [
      likedPosts,
      bookmarkedPosts,
      repostedPosts,
      following,
      authorsFollowingMe,
    ] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.repost.findMany({
        where: { userId: currentUserId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.follow.findMany({
        where: { followerId: currentUserId, followingId: { in: authorIds } },
        select: { followingId: true },
      }),
      options.includeAuthorFollowsMe
        ? this.prisma.follow.findMany({
            where: {
              followerId: { in: authorIds },
              followingId: currentUserId,
            },
            select: { followerId: true },
          })
        : [],
    ]);

    const likedSet = new Set(likedPosts.map((like) => like.postId));
    const bookmarkedSet = new Set(
      bookmarkedPosts.map((bookmark) => bookmark.postId),
    );
    const repostedSet = new Set(repostedPosts.map((repost) => repost.postId));
    const followingSet = new Set(following.map((follow) => follow.followingId));
    const authorFollowsMeSet = new Set(
      authorsFollowingMe.map((follow) => follow.followerId),
    );

    return posts.map((post) => ({
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
        ...(options.includeAuthorFollowsMe && {
          isFollowedByAuthor: authorFollowsMeSet.has(post.user.id),
        }),
      },
    }));
  }

  async enrichPost<T extends PostWithAuthor>(
    currentUserId: string,
    post: T,
    options: { includeAuthorFollowsMe?: boolean } = {},
  ) {
    const [enrichedPost] = await this.enrichPosts(
      currentUserId,
      [post],
      options,
    );
    return enrichedPost;
  }
}
