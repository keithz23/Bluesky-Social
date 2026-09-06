import { Injectable, NotFoundException } from '@nestjs/common';
import { VisibilityService } from 'src/common/services/visibility.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostFormatterService } from './post-formatter.service';

@Injectable()
export class PostReplyQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postFormatter: PostFormatterService,
    private readonly visibility: VisibilityService,
  ) {}

  async getReplies(
    userId: string,
    postId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const pageSize = Number(limit) || 20;

    const parentPost = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      select: {
        user: {
          select: {
            id: true,
            isPrivate: true,
          },
        },
      },
    });

    if (!parentPost) throw new NotFoundException('Post not found');

    if (!(await this.visibility.canViewUserContent(userId, parentPost.user))) {
      return { replies: [], nextCursor: null, hasMore: false };
    }

    const replies = await this.prisma.post.findMany({
      where: {
        parentPostId: postId,
        isDeleted: false,
      },
      take: pageSize + 1,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      ...(cursor && {
        cursor: { id: cursor },
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
        parentPostId: true,
        rootPostId: true,
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

    const hasMore = replies.length > pageSize;
    if (hasMore) replies.pop();

    const nextCursor = hasMore ? replies[replies.length - 1].id : null;

    return {
      replies: await this.postFormatter.enrichPosts(userId, replies, {
        includeAuthorFollowsMe: true,
      }),
      nextCursor,
      hasMore,
    };
  }
}
