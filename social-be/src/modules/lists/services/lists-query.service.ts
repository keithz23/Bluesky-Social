import { Injectable } from '@nestjs/common';
import { VisibilityService } from 'src/common/services/visibility.service';
import { FeedQueryDto } from 'src/modules/feed/dto/requests/feed-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListsQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

  async getLists(userId: string, query: FeedQueryDto) {
    const limit = query.limit ?? 20;
    const cursorId = query.cursor;
    let ownerId = userId;

    if (query.username) {
      const owner = await this.prisma.user.findUnique({
        where: { username: query.username },
        select: { id: true, isPrivate: true },
      });

      if (!owner) return { lists: [], hasMore: false, nextCursor: null };

      if (!(await this.visibility.canViewUserContent(userId, owner))) {
        return { lists: [], hasMore: false, nextCursor: null };
      }

      ownerId = owner.id;
    }

    const lists = await this.prisma.list.findMany({
      where: {
        OR: [
          { userId: ownerId },
          {
            members: {
              some: {
                memberId: ownerId,
              },
            },
          },
        ],
      },
      take: limit + 1,
      ...(cursorId && {
        cursor: { id: cursorId },
        skip: 1,
      }),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        listPhoto: true,
        createdAt: true,
        userId: true,
        members: {
          select: {
            id: true,
            listId: true,
            memberId: true,
            addedBy: true,
            addedAt: true,
            user: {
              select: {
                id: true,
                bio: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                coverUrl: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            bio: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            coverUrl: true,
          },
        },
      },
    });

    const hasMore = lists.length > limit;
    if (hasMore) lists.pop();

    const nextCursor = hasMore ? lists[lists.length - 1].id : null;

    return {
      lists,
      hasMore,
      nextCursor,
    };
  }

  async getListById(userId: string, listId: string) {
    const list = await this.prisma.list.findUnique({
      where: {
        id: listId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        listPhoto: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isPrivate: true,
          },
        },
        items: {
          orderBy: { addedAt: 'desc' },
          take: 20,
          select: {
            id: true,
            post: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!list) return null;

    if (
      !(await this.visibility.canViewUserContent(userId, {
        id: list.userId,
        isPrivate: list.user.isPrivate,
      }))
    ) {
      return null;
    }

    const mappedPosts = list.items.map((item) => item.post);
    const postIds = mappedPosts.map((post) => post.id);
    const [likedPosts, bookmarkedPosts, repostedPosts] =
      postIds.length > 0
        ? await Promise.all([
            this.prisma.like.findMany({
              where: { userId, postId: { in: postIds } },
              select: { postId: true },
            }),
            this.prisma.bookmark.findMany({
              where: { userId, postId: { in: postIds } },
              select: { postId: true },
            }),
            this.prisma.repost.findMany({
              where: { userId, postId: { in: postIds } },
              select: { postId: true },
            }),
          ])
        : [[], [], []];

    const likedSet = new Set(likedPosts.map((item) => item.postId));
    const bookmarkedSet = new Set(bookmarkedPosts.map((item) => item.postId));
    const repostedSet = new Set(repostedPosts.map((item) => item.postId));

    const listData = {
      id: list.id,
      name: list.name,
      description: list.description,
      listPhoto: list.listPhoto,
      createdAt: list.createdAt,
      userId: list.userId,
      user: list.user,
    };

    return {
      ...listData,
      posts: mappedPosts.map((post) => ({
        ...post,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        isReposted: repostedSet.has(post.id),
      })),
    };
  }
}
