import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { UpdatePostPayload } from "../interfaces/post.interface";

export const PostService = {
  createPost: (payload: FormData) => {
    return axiosInstance.post(
      `${API_ENDPOINT.POSTS.CREATE_POST}`,
      payload,
    );
  },

  updatePost: (payload: UpdatePostPayload) => {
    return axiosInstance.put(
      `${API_ENDPOINT.POSTS.UPDATE_POST(payload.id)}`,
      payload,
    );
  },
};
