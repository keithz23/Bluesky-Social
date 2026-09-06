import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { VisibilityService } from 'src/common/services/visibility.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostQueryDto } from '../dto/requests';
import { PostFormatterService } from './post-formatter.service';

@Injectable()
export class PostUserQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postFormatter: PostFormatterService,
    private readonly visibility: VisibilityService,
  ) {}

  async getPostByUsername(
    currentUserId: string,
    username: string,
    query: PostQueryDto,
  ) {
    const limit = query.limit ?? 20;

    const user = await this.prisma.user.findFirst({
      where: { username },
      select: { id: true, isPrivate: true },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!(await this.visibility.canViewUserContent(currentUserId, user))) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    if (query.filter === 'likes') {
      const likes = await this.prisma.like.findMany({
        where: {
          userId: user.id,
        },
        ...(query.cursor && {
          cursor: { id: query.cursor },
          skip: 1,
        }),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
        select: {
          id: true,
          postId: true,
          post: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              likeCount: true,
              replyCount: true,
              repostCount: true,
              bookmarkCount: true,
              replyPolicy: true,
              replyFollowers: true,
              replyFollowing: true,
              replyMentioned: true,
              postTheme: true,
              isPinned: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  verified: true,
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
          },
        },
      });

      const hasMore = likes.length > limit;
      if (hasMore) likes.pop();
      const nextCursor = hasMore ? likes[likes.length - 1].id : null;

      const postIds = likes.map((l) => l.postId);
      const [bookmarkedPosts, repostedPosts] = await Promise.all([
        this.prisma.bookmark.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.repost.findMany({
          where: { userId: currentUserId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);

      const bookmarkedSet = new Set(bookmarkedPosts.map((b) => b.postId));
      const repostedSet = new Set(repostedPosts.map((r) => r.postId));

      return {
        posts: likes.map((l) => ({
          ...l.post,
          isLiked: true,
          isBookmarked: bookmarkedSet.has(l.postId),
          isReposted: repostedSet.has(l.postId),
        })),
        nextCursor,
        hasMore,
      };
    }

    const baseWhere = {
      userId: user.id,
      isDeleted: false,
    };

    const where = {
      posts: { ...baseWhere, parentPostId: null },
      replies: { ...baseWhere, parentPostId: { not: null } },
      media: { ...baseWhere, parentPostId: null, media: { some: {} } },
      videos: {
        ...baseWhere,
        parentPostId: null,
        media: { some: { mediaType: MediaType.VIDEO } },
      },
    }[query.filter ?? 'posts'] ?? { ...baseWhere, parentPostId: null };

    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1,
      }),
      select: {
        id: true,
        content: true,
        createdAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        parentPostId: true,
        rootPostId: true,
        postTheme: true,
        isPinned: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            followersCount: true,
            followingCount: true,
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

    if (posts.length === 0)
      return { posts: [], nextCursor: null, hasMore: false };

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    return {
      posts: await this.postFormatter.enrichPosts(currentUserId, posts),
      nextCursor,
      hasMore,
    };
  }
}
