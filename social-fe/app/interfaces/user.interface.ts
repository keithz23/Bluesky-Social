export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  dateOfBirth?: string;
  avatarUrl: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  bio: string;
  followStatus: string;
  isFollowedByAuthor?: boolean;
  hasPassword?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email?: string;
    username: string;
    displayName: string;
    dateOfBirth?: string;
    avatarUrl: string;
    verified: boolean;
    followersCount: number;
    followingCount: number;
    bio: string;
    followStatus: string;
    isFollowedByAuthor?: boolean;
    hasPassword?: boolean;

  }
}
