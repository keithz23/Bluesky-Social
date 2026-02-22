import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { UpdatePostPayload } from "../interfaces/post.interface";

export const PostService = {
  createPost: (payload: FormData) => {
    return axiosInstance.post(`${API_ENDPOINT.POSTS.CREATE_POST}`, payload);
  },

  updatePost: (payload: UpdatePostPayload) => {
    return axiosInstance.put(
      `${API_ENDPOINT.POSTS.UPDATE_POST(payload.id)}`,
      payload,
    );
  },

  deletePost: (postId: string) => {
    return axiosInstance.delete(
      `${API_ENDPOINT.POSTS.DELETE_POST(postId)}`,
      {},
    );
  },

  getPostsByUsername: async (
    username: string,
    filter: string,
    cursor?: string,
  ) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (filter) params.set("filter", filter);

    const { data } = await axiosInstance.get(
      `${API_ENDPOINT.POSTS.GET_BY_USERNAME(username)}?${params}`,
    );
    return data;
  },
};
