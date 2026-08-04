import { PostFormatterService } from './post-formatter.service';

const makePrisma = () => ({
  like: { findMany: jest.fn() },
  bookmark: { findMany: jest.fn() },
  repost: { findMany: jest.fn() },
  follow: { findMany: jest.fn() },
});

describe('PostFormatterService', () => {
  it('adds viewer state and follow status to posts', async () => {
    const prisma = makePrisma();
    prisma.like.findMany.mockResolvedValue([{ postId: 'post-1' }]);
    prisma.bookmark.findMany.mockResolvedValue([{ postId: 'post-2' }]);
    prisma.repost.findMany.mockResolvedValue([{ postId: 'post-1' }]);
    prisma.follow.findMany.mockResolvedValueOnce([{ followingId: 'author-2' }]);

    const service = new PostFormatterService(prisma as any);
    const posts = [
      { id: 'post-1', content: 'hello', user: { id: 'author-1' } },
      { id: 'post-2', content: 'world', user: { id: 'author-2' } },
    ];

    await expect(service.enrichPosts('viewer-1', posts)).resolves.toEqual([
      {
        id: 'post-1',
        content: 'hello',
        isLiked: true,
        isBookmarked: false,
        isReposted: true,
        user: { id: 'author-1', followStatus: 'none' },
      },
      {
        id: 'post-2',
        content: 'world',
        isLiked: false,
        isBookmarked: true,
        isReposted: false,
        user: { id: 'author-2', followStatus: 'following' },
      },
    ]);

    expect(prisma.like.findMany).toHaveBeenCalledWith({
      where: { userId: 'viewer-1', postId: { in: ['post-1', 'post-2'] } },
      select: { postId: true },
    });
  });

  it('can include whether each author follows the viewer', async () => {
    const prisma = makePrisma();
    prisma.like.findMany.mockResolvedValue([]);
    prisma.bookmark.findMany.mockResolvedValue([]);
    prisma.repost.findMany.mockResolvedValue([]);
    prisma.follow.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ followerId: 'author-1' }]);

    const service = new PostFormatterService(prisma as any);
    const posts = [{ id: 'post-1', user: { id: 'author-1' } }];

    const [post] = await service.enrichPosts('viewer-1', posts, {
      includeAuthorFollowsMe: true,
    });

    expect(post.user).toEqual({
      id: 'author-1',
      followStatus: 'none',
      isFollowedByAuthor: true,
    });
  });
});
