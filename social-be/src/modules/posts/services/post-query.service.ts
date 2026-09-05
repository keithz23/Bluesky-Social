import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { VisibilityService } from 'src/common/services/visibility.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostQueryDto, SearchPostsDto } from '../dto/requests';
import { PostFormatterService } from './post-formatter.service';

@Injectable()
export class PostQueryService {
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

  async searchPosts(currentUserId: string, query: SearchPostsDto) {
    const searchTerm = query.q.trim();
    const limit = query.limit ?? 20;

    if (!searchTerm) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    const normalizedHashtag = searchTerm.startsWith('#')
      ? searchTerm.slice(1).toLowerCase()
      : searchTerm.toLowerCase();

    const excludedUserIds = await this.visibility.getExcludedUserIds(
      currentUserId,
      { includeBlockedBy: true },
    );

    const posts = await this.prisma.post.findMany({
      where: {
        isDeleted: false,
        ...(query.ownOnly
          ? { userId: currentUserId }
          : excludedUserIds.length > 0 && {
              userId: { notIn: excludedUserIds },
            }),
        OR: [
          {
            content: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            hashtags: {
              some: {
                hashtag: {
                  name: {
                    contains: normalizedHashtag,
                    mode: 'insensitive',
                  },
                },
              },
            },
          },
        ],
      },
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

    const hasMore = posts.length > limit;
    if (hasMore) posts.pop();
    const nextCursor = hasMore ? posts[posts.length - 1].id : null;

    if (posts.length === 0) {
      return { posts: [], nextCursor: null, hasMore: false };
    }

    return {
      posts: await this.postFormatter.enrichPosts(currentUserId, posts),
      nextCursor,
      hasMore,
    };
  }

  async getPostDetail(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        likeCount: true,
        replyCount: true,
        repostCount: true,
        bookmarkCount: true,
        replyPolicy: true,
        replyFollowers: true,
        replyFollowing: true,
        replyMentioned: true,
        allowQuote: true,
        parentPostId: true,
        rootPostId: true,
        postTheme: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            verified: true,
            bio: true,
            isPrivate: true,
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

    if (!post) throw new NotFoundException('Post not found');

    if (
      !(await this.visibility.canViewUserContent(userId, {
        id: post.user.id,
        isPrivate: post.user.isPrivate,
      }))
    ) {
      throw new NotFoundException('Post not found');
    }

    // Resolve a whole reply chain in one recursive query, then hydrate its
    // posts in one Prisma query. This avoids one database round trip per level.
    const maxDepth = 20;
    const ancestorRows = post.parentPostId
      ? await this.prisma.$queryRaw<Array<{ id: string; depth: number }>>`
          WITH RECURSIVE ancestors AS (
            SELECT id, parent_post_id, 1 AS depth, ARRAY[id] AS path
            FROM posts
            WHERE id = ${post.parentPostId} AND is_deleted = false

            UNION ALL

            SELECT parent.id, parent.parent_post_id, ancestors.depth + 1, ancestors.path || parent.id
            FROM posts AS parent
            INNER JOIN ancestors ON parent.id = ancestors.parent_post_id
            WHERE parent.is_deleted = false
              AND ancestors.depth < ${maxDepth}
              AND NOT parent.id = ANY(ancestors.path)
          )
          SELECT id, depth FROM ancestors
        `
      : [];
    const parentIdsInOrder = ancestorRows
      .sort((a, b) => b.depth - a.depth)
      .map((ancestor) => ancestor.id);
    const parentRecords = parentIdsInOrder.length
      ? await this.prisma.post.findMany({
          where: { id: { in: parentIdsInOrder }, isDeleted: false },
          select: {
            id: true,
            content: true,
            createdAt: true,
            parentPostId: true,
            likeCount: true,
            replyCount: true,
            repostCount: true,
            bookmarkCount: true,
            replyPolicy: true,
            replyFollowers: true,
            replyFollowing: true,
            replyMentioned: true,
            postTheme: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                verified: true,
                bio: true,
                isPrivate: true,
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
        })
      : [];
    const parentsById = new Map(
      parentRecords.map((parent) => [parent.id, parent]),
    );
    const parentChain = parentIdsInOrder.flatMap((id) => {
      const parent = parentsById.get(id);
      return parent ? [parent] : [];
    });

    const parentIds = parentChain.map((p) => p.id);
    const allUserIds = [
      ...new Set([post.user.id, ...parentChain.map((p) => p.user.id)]),
    ];

    const [
      liked,
      bookmarked,
      reposted,
      parentLikes,
      parentBookmarks,
      parentReposts,
      parentFollows,
      authorsFollowingMe,
    ] = await Promise.all([
      this.prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      this.prisma.bookmark.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      this.prisma.repost.findUnique({
        where: { userId_postId: { userId, postId } },
      }),
      parentIds.length > 0
        ? this.prisma.like.findMany({
            where: { userId, postId: { in: parentIds } },
            select: { postId: true },
          })
        : [],
      parentIds.length > 0
        ? this.prisma.bookmark.findMany({
            where: { userId, postId: { in: parentIds } },
            select: { postId: true },
          })
        : [],
      parentIds.length > 0
        ? this.prisma.repost.findMany({
            where: { userId, postId: { in: parentIds } },
            select: { postId: true },
          })
        : [],
      this.prisma.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: allUserIds },
        },
        select: { followingId: true },
      }),
      this.prisma.follow.findMany({
        where: {
          followerId: { in: allUserIds },
          followingId: userId,
        },
        select: { followerId: true },
      }),
    ]);

    const parentLikeSet = new Set(
      (parentLikes as { postId: string }[]).map((l) => l.postId),
    );
    const parentBookmarkSet = new Set(
      (parentBookmarks as { postId: string }[]).map((b) => b.postId),
    );
    const parentRepostSet = new Set(
      (parentReposts as { postId: string }[]).map((r) => r.postId),
    );
    const followSet = new Set(
      (parentFollows as { followingId: string }[]).map((f) => f.followingId),
    );
    const authorFollowsMeSet = new Set(
      (authorsFollowingMe as { followerId: string }[]).map((f) => f.followerId),
    );

    const enrichedParentChain = parentChain.map((parent) => ({
      ...parent,
      isLiked: parentLikeSet.has(parent.id),
      isBookmarked: parentBookmarkSet.has(parent.id),
      isReposted: parentRepostSet.has(parent.id),
      user: {
        ...parent.user,
        followStatus:
          parent.user.id === userId
            ? null
            : followSet.has(parent.user.id)
              ? 'following'
              : 'none',
        isFollowedByAuthor: authorFollowsMeSet.has(parent.user.id),
      },
    }));

    return {
      ...post,
      isLiked: !!liked,
      isBookmarked: !!bookmarked,
      isReposted: !!reposted,
      parentChain: enrichedParentChain,
      user: {
        ...post.user,
        followStatus:
          post.user.id === userId
            ? null
            : followSet.has(post.user.id)
              ? 'following'
              : 'none',
        isFollowedByAuthor: authorFollowsMeSet.has(post.user.id),
      },
    };
  }
}
