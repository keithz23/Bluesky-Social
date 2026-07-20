import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const LikeService = {
  like: (postId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.LIKES.LIKE(postId));
  },

  unLike: (postId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.LIKES.UNLIKE(postId));
  },
};
