export interface SuggestionsUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  followersCount: number;
  bio: string | null;
}
