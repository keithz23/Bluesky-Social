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
  createdAt: string;
}

export interface CurrentUserResponse extends PublicUserResponse {
  email: string;
  dateOfBirth: string | null;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: "EMAIL" | "TOTP" | null;
  twoFactorEnabledAt: string | null;
}

export interface ProfileResponse extends PublicUserResponse {
  followStatus: "following" | "requested" | "none" | null;
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
