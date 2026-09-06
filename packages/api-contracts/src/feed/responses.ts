import type { PostsPageResponse } from "../posts/responses";

export type FeedPageResponse = PostsPageResponse;

export type FeedIcon = "Flame" | "Users" | "Heart" | "Image" | "Film";
export type FeedColor = "blue" | "indigo" | "rose" | "violet" | "slate";

export interface FeedCatalogItemResponse {
  slug: string;
  name: string;
  description: string;
  icon: FeedIcon;
  color: FeedColor;
  isPinned?: boolean;
}

export interface FeedPinResponse {
  slug: string;
  isPinned: boolean;
}
