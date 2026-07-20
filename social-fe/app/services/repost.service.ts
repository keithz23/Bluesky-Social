import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const RepostService = {
  repost: (postId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.REPOSTS.REPOST(postId));
  },

  unRepost: (postId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.REPOSTS.UNREPOST(postId));
  },
};
