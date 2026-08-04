export interface FeedCatalogItem {
  slug: string;
  name: string;
  description: string;
  icon: "Flame" | "Users" | "Heart" | "Image" | "Film";
  color: "blue" | "indigo" | "rose" | "violet" | "slate";
  isPinned?: boolean;
}

export interface TrendingTopic {
  id: string;
  name: string;
  postCount: number;
  recentPostCount: number;
  score: number;
}

export interface ExploreAccount {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  verified: boolean;
  followersCount: number;
}

export interface ExploreResponse {
  topics: TrendingTopic[];
  accounts: ExploreAccount[];
  feeds: FeedCatalogItem[];
}
