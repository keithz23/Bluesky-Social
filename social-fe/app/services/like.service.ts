import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const LikeService = {
  like: (postId: string) => {
    return axiosInstance.post(API_ENDPOINT.LIKES.LIKE(postId));
  },

  unLike: (postId: string) => {
    return axiosInstance.post(API_ENDPOINT.LIKES.UNLIKE(postId));
  },
};
