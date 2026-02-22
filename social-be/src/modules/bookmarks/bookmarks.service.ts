import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async bookMark(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) throw new BadRequestException('Bookmark already');

    await this.prisma.$transaction([
      this.prisma.bookmark.create({
        data: { userId, postId },
      }),

      this.prisma.post.update({
        where: { id: postId },
        data: {
          bookmarkCount: { increment: 1 },
        },
      }),
    ]);
    return { bookmark: true };
  }

  async unBookmark(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (!existing) throw new BadRequestException('Not yet');

    await this.prisma.$transaction([
      this.prisma.bookmark.delete({
        where: { userId_postId: { userId, postId } },
      }),

      this.prisma.post.update({
        where: { id: postId },
        data: { bookmarkCount: { decrement: 1 } },
      }),
    ]);

    return { bookmark: false };
  }

  async getBookmarks(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: {
        followingId: true,
      },
    });

    const followingIds = following.map((f) => f.followingId);
    const followingSet = new Set(followingIds);

    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        post: {
          include: {
            media: { orderBy: { orderIndex: 'asc' } },
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                verified: true,
                followersCount: true,
                followingCount: true,
              },
            },
          },
        },
      },
    });

    const postIds = bookmarks.map((b) => b.post.id);

    const likedPosts = await this.prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const likedSet = new Set(likedPosts.map((l) => l.postId));

    const repostedPosts = await this.prisma.repost.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const repostedSet = new Set(repostedPosts.map((rp) => rp.postId));

    return bookmarks.map((b) => ({
      ...b,
      post: {
        ...b.post,
        isLiked: likedSet.has(b.post.id),
        isReposted: repostedSet.has(b.post.id),
        isBookmarked: true,
      },
      user: {
        ...b.post.user,
        followStatus:
          b.post.user.id === userId
            ? null
            : followingSet.has(b.post.user.id)
              ? 'following'
              : 'none',
      },
    }));
  }
}
