import { TwoFactorMethod, User, UserStatus } from '@prisma/client';
import {
  toCurrentUserResponse,
  toRegisterResponse,
  toRoleResponses,
  UserWithRoles,
} from './auth-response.mapper';

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

describe('auth response mapper', () => {
  it('maps a current user without exposing persistence-only fields', () => {
    const response = toCurrentUserResponse(user);

    expect(response).toEqual(
      expect.objectContaining({
        id: 'user-1',
        createdAt: '2026-09-04T03:22:07.085Z',
        dateOfBirth: '2000-01-01T00:00:00.000Z',
        hasPassword: true,
        twoFactorMethod: TwoFactorMethod.TOTP,
      }),
    );
    expect(response).not.toHaveProperty('passwordHash');
    expect(response).not.toHaveProperty('googleId');
  });

  it('maps the minimal register response', () => {
    expect(toRegisterResponse(user)).toEqual({
      id: 'user-1',
      username: 'tester',
      email: 'tester@example.com',
      displayName: 'Tester',
      verified: true,
      createdAt: '2026-09-04T03:22:07.085Z',
    });
  });

  it('maps role permissions to public permission names', () => {
    const response = toRoleResponses({
      ...user,
      userRoles: [
        {
          role: {
            id: 'role-1',
            name: 'user',
            level: 1,
            rolePermissions: [{ permission: { name: 'post:create' } }],
          },
        },
      ],
    } as UserWithRoles);

    expect(response).toEqual([
      {
        id: 'role-1',
        name: 'user',
        level: 1,
        permissions: ['post:create'],
      },
    ]);
  });
});
