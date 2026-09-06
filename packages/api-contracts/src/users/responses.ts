import type { IsoDateTimeString } from "../common/api-envelope";

export type FollowStatus = "following" | "requested" | "none";

export interface PublicUserResponse {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: IsoDateTimeString;
}

export interface CurrentUserResponse extends PublicUserResponse {
  email: string;
  dateOfBirth: IsoDateTimeString | null;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: "EMAIL" | "TOTP" | null;
  twoFactorEnabledAt: IsoDateTimeString | null;
}

export interface ProfileResponse extends PublicUserResponse {
  followStatus: FollowStatus | null;
  isOwner: boolean;
}

export interface UserSearchItemResponse {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  verified: boolean;
  isAdded: boolean;
}

export type UserSummaryResponse = Partial<PublicUserResponse> & {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  verified: boolean;
  followStatus?: FollowStatus | null;
  isFollowedByAuthor?: boolean;
  isOwner?: boolean;
};
