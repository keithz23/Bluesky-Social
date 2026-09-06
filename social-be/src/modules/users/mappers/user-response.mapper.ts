import { Prisma, User } from '@prisma/client';
import {
  CurrentUserResponseDto,
  FollowStatus,
  ProfileResponseDto,
  PublicUserResponseDto,
  UserSearchItemResponseDto,
} from '../dto/responses';

export const PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  coverUrl: true,
  bio: true,
  verified: true,
  isPrivate: true,
  createdAt: true,
  followersCount: true,
  followingCount: true,
  postsCount: true,
} satisfies Prisma.UserSelect;

export type PublicProfileRecord = Prisma.UserGetPayload<{
  select: typeof PUBLIC_PROFILE_SELECT;
}>;

export interface UserSearchRow {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  isAdded: boolean;
}

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

export function toProfileResponse(
  user: PublicProfileRecord,
  context: { followStatus: FollowStatus | null; isOwner: boolean },
): ProfileResponseDto {
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
    ...context,
  };
}

export function toUserSearchItemResponse(
  user: UserSearchRow,
): UserSearchItemResponseDto {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    coverUrl: user.coverUrl,
    verified: user.verified,
    isAdded: Boolean(user.isAdded),
  };
}
