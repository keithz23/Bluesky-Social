import { TwoFactorMethod } from '@prisma/client';

export interface SignupData {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

export interface SigninData {
  emailOrUsername: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthUserResponse {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  googleId: string | null;
  verified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: Date;
  dateOfBirth: Date | null;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorMethod: TwoFactorMethod | null;
  twoFactorEnabledAt: Date | null;
}

export interface AuthResponse {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken: string;
}
