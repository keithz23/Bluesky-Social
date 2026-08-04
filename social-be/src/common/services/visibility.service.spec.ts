import { VisibilityService } from './visibility.service';

const makePrisma = () => ({
  follow: { findMany: jest.fn(), findUnique: jest.fn() },
  block: { findMany: jest.fn() },
  mute: { findMany: jest.fn() },
});

describe('VisibilityService', () => {
  it('allows owners and public profiles without querying follows', async () => {
    const prisma = makePrisma();
    const service = new VisibilityService(prisma as any);

    await expect(
      service.canViewUserContent('user-1', {
        id: 'user-1',
        isPrivate: true,
      }),
    ).resolves.toBe(true);
    await expect(
      service.canViewUserContent('viewer-1', {
        id: 'user-1',
        isPrivate: false,
      }),
    ).resolves.toBe(true);
    expect(prisma.follow.findUnique).not.toHaveBeenCalled();
  });

  it('requires a follow relationship for private profiles', async () => {
    const prisma = makePrisma();
    prisma.follow.findUnique.mockResolvedValue({ id: 'follow-1' });
    const service = new VisibilityService(prisma as any);

    await expect(
      service.canViewUserContent('viewer-1', {
        id: 'private-user',
        isPrivate: true,
      }),
    ).resolves.toBe(true);
    expect(prisma.follow.findUnique).toHaveBeenCalledWith({
      where: {
        followerId_followingId: {
          followerId: 'viewer-1',
          followingId: 'private-user',
        },
      },
      select: { id: true },
    });
  });

  it('returns following ids and excluded users for a viewer', async () => {
    const prisma = makePrisma();
    prisma.follow.findMany.mockResolvedValue([{ followingId: 'author-1' }]);
    prisma.block.findMany
      .mockResolvedValueOnce([{ blockedId: 'blocked-1' }])
      .mockResolvedValueOnce([{ blockerId: 'blocked-by-1' }]);
    prisma.mute.findMany.mockResolvedValue([{ mutedId: 'muted-1' }]);
    const service = new VisibilityService(prisma as any);

    await expect(
      service.getViewerContext('viewer-1', { includeBlockedBy: true }),
    ).resolves.toEqual({
      followingIds: ['author-1'],
      excludedUserIds: ['blocked-1', 'muted-1', 'blocked-by-1'],
    });
  });
});
