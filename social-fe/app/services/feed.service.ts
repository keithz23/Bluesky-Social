import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const FeedService = {
  getFeed: async (cursor?: string, limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.FEED.GET_FEED({ cursor, limit }),
    );
    return data;
  },
};
