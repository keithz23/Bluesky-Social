import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VisibilityService } from 'src/common/services/visibility.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinPostQueryDto } from '../dto/requests';
import { PostFormatterService } from './post-formatter.service';

@Injectable()
export class PostPinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postFormatter: PostFormatterService,
    private readonly visibility: VisibilityService,
  ) {}

  async pinPost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId) {
      throw new ForbiddenException('You are not authorized to pin this post');
    }

    if (post.isPinned) {
      return { message: 'Post pinned successfully' };
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { isPinned: true },
    });

    return { message: 'Post pinned successfully' };
  }

  async getPinPost(
    username: string,
    currentUserId: string,
    query: PinPostQueryDto,
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

    const posts = await this.prisma.post.findMany({
      where: { userId: user.id, isPinned: true, isDeleted: false },
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

  async unpinPost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId)
      throw new ForbiddenException('You are not authorized to unpin this post');

    await this.prisma.post.update({
      where: { id: postId },
      data: { isPinned: false },
    });

    return { message: 'Post unpinned successfully' };
  }
}
