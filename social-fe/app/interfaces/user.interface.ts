export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  googleId?: string | null;
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
  accessToken?: string;
  refreshToken?: string;
}

export interface Roles {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
  roles: Roles[];
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
