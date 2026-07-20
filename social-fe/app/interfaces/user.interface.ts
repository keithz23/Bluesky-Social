export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  dateOfBirth?: string;
  avatarUrl: string;
  coverUrl?: string;
  verified: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
  followersCount: number;
  followingCount: number;
  postsCount?: number;
  bio: string;
  followStatus: string;
  isFollowedByAuthor?: boolean;
  hasPassword?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorMethod?: "EMAIL" | "TOTP" | null;
  twoFactorEnabledAt?: string | null;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export type Login2FARequiredResponse = {
  requires2FA: true;
  challengeId: string;
  maskedEmail: string;
};

export type LoginResponse =
  | {
      accessToken: string;
      refreshToken: string;
      user: User;
    }
  | Login2FARequiredResponse;
