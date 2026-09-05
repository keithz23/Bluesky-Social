export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  verified: boolean;
  isPrivate?: boolean;
  createdAt?: string;
  dateOfBirth?: string | null;
  isOwner?: boolean;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  followStatus?: string | null;
  isFollowedByAuthor?: boolean;
  hasPassword?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: "EMAIL" | "TOTP" | null;
  twoFactorEnabledAt?: string | null;
}

export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatarFile?: File;
  coverFile?: File;
}

export interface UpdateAccountPrivacyData {
  isPrivate: boolean;
}

export interface ChangeUsernameData {
  username: string;
}

export interface ChangeDateOfBirthData {
  dateOfBirth: string;
}
