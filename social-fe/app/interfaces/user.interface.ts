export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  bio: string;
  followStatus: string;
  isFollowedByAuthor?: boolean;
}
