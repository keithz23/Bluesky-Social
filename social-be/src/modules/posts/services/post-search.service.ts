import { Injectable } from '@nestjs/common';
import { VisibilityService } from 'src/common/services/visibility.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SearchPostsDto } from '../dto/requests';
import { PostFormatterService } from './post-formatter.service';

@Injectable()
export class PostSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postFormatter: PostFormatterService,
    private readonly visibility: VisibilityService,
  ) {}

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
}
