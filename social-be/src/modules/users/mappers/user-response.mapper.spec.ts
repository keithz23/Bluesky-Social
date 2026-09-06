import { TwoFactorMethod, User, UserStatus } from '@prisma/client';
import {
  PublicProfileRecord,
  toCurrentUserResponse,
  toProfileResponse,
  toUserSearchItemResponse,
} from './user-response.mapper';

const user = {
  id: 'user-1',
  username: 'tester',
  email: 'tester@example.com',
  displayName: 'Tester',
  bio: null,
  avatarUrl: null,
  coverUrl: null,
  googleId: 'internal-google-id',
  verified: true,
  isPrivate: false,
  followersCount: 1,
  followingCount: 2,
  postsCount: 3,
  createdAt: new Date('2026-09-04T03:22:07.085Z'),
  dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
  passwordHash: 'hash',
  twoFactorEnabled: true,
  twoFactorMethod: TwoFactorMethod.TOTP,
  twoFactorEnabledAt: new Date('2026-09-04T03:32:56.949Z'),
  status: UserStatus.ACTIVE,
} as User;

describe('user response mapper', () => {
  it('maps an owner response without persistence-only fields', () => {
    const response = toCurrentUserResponse(user);

    expect(response).toEqual(
      expect.objectContaining({
        id: 'user-1',
        createdAt: '2026-09-04T03:22:07.085Z',
        dateOfBirth: '2000-01-01T00:00:00.000Z',
        hasPassword: true,
      }),
    );
    expect(response).not.toHaveProperty('passwordHash');
    expect(response).not.toHaveProperty('googleId');
  });

  it('maps a public profile with relationship context', () => {
    const response = toProfileResponse(user as PublicProfileRecord, {
      followStatus: null,
      isOwner: true,
    });

    expect(response.createdAt).toBe('2026-09-04T03:22:07.085Z');
    expect(response.isOwner).toBe(true);
    expect(response).not.toHaveProperty('email');
  });

  it('normalizes the raw search membership flag', () => {
    expect(
      toUserSearchItemResponse({
        id: 'user-2',
        username: 'another',
        displayName: 'Another',
        bio: null,
        avatarUrl: null,
        coverUrl: null,
        verified: false,
        isAdded: true,
      }),
    ).toEqual(expect.objectContaining({ id: 'user-2', isAdded: true }));
  });
});
