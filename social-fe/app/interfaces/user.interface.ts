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
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  followStatus?: string;
  isFollowedByAuthor?: boolean;
  hasPassword?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: "EMAIL" | "TOTP" | null;
  twoFactorEnabledAt?: string | null;
}
