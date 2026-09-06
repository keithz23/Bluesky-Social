import { Injectable, NotFoundException } from '@nestjs/common';
import { VisibilityService } from 'src/common/services/visibility.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: VisibilityService,
  ) {}

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
