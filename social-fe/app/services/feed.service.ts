import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Feed } from "../interfaces/feed.interface";
import { FeedCatalogItem } from "../interfaces/discovery.interface";

export const FeedService = {
  getFeed: async (cursor?: string, limit?: number, seed?: string) => {
    return apiClient.get<{
      posts: Feed[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      API_ENDPOINT.FEED.GET_FEED({ cursor, limit, seed }),
    );
  },
  getCatalog: () => apiClient.get<FeedCatalogItem[]>(API_ENDPOINT.FEED.CATALOG),
  getPinned: () => apiClient.get<FeedCatalogItem[]>(API_ENDPOINT.FEED.PINNED),
  pin: (slug: string) =>
    apiClient.post<{ slug: string; isPinned: boolean }>(API_ENDPOINT.FEED.PIN(slug)),
  unpin: (slug: string) =>
    apiClient.delete<{ slug: string; isPinned: boolean }>(API_ENDPOINT.FEED.PIN(slug)),
  getSystemFeed: (slug: string, cursor?: string, limit?: number, seed?: string) =>
    apiClient.get<{ posts: Feed[]; nextCursor: string | null; hasMore: boolean }>(
      API_ENDPOINT.FEED.POSTS(slug, { cursor, limit, seed }),
    ),
};
