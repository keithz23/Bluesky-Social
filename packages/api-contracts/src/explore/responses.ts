import type { FeedCatalogItemResponse } from "../feed/responses";

export interface TrendingTopicResponse {
  id: string;
  name: string;
  postCount: number;
  recentPostCount: number;
  score: number;
}

export interface ExploreAccountResponse {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  verified: boolean;
  followersCount: number;
}

export interface ExploreResponse {
  topics: TrendingTopicResponse[];
  accounts: ExploreAccountResponse[];
  feeds: FeedCatalogItemResponse[];
}
