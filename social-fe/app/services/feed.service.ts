import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Feed } from "../interfaces/feed.interface";

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
};
