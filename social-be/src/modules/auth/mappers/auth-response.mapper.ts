import { Prisma, User } from '@prisma/client';
import {
  CurrentUserResponseDto,
  PublicUserResponseDto,
  RegisterResponseDto,
  RoleResponseDto,
} from '../dto/responses';

export type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    userRoles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true };
            };
          };
        };
      };
    };
  };
}>;

export function toPublicUserResponse(user: User): PublicUserResponseDto {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    verified: user.verified,
    isPrivate: user.isPrivate,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toCurrentUserResponse(user: User): CurrentUserResponseDto {
  return {
    ...toPublicUserResponse(user),
    email: user.email,
    dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
    hasPassword: Boolean(user.passwordHash),
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorMethod: user.twoFactorMethod,
    twoFactorEnabledAt: user.twoFactorEnabledAt?.toISOString() ?? null,
  };
}

export function toRoleResponses(user: UserWithRoles): RoleResponseDto[] {
  return user.userRoles.map(({ role }) => ({
    id: role.id,
    name: role.name,
    level: role.level,
    permissions: role.rolePermissions.map(({ permission }) => permission.name),
  }));
}

export function toRegisterResponse(user: User): RegisterResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    verified: user.verified,
    createdAt: user.createdAt.toISOString(),
  };
}
