import { axiosInstance } from "@/lib/axios";
import type { AxiosProgressEvent } from "axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { UpdatePostPayload } from "../interfaces/post.interface";

export const PostService = {
  createPost: (
    payload: FormData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    return axiosInstance.post(`${API_ENDPOINT.POSTS.CREATE_POST}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },

  updatePost: (payload: UpdatePostPayload) => {
    return axiosInstance.put(
      `${API_ENDPOINT.POSTS.UPDATE_POST(payload.id)}`,
      payload,
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

  getPostById: async (postId: string) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.POSTS.GET_BY_ID(postId),
    );

    return data;
  },

  searchPosts: async (q: string, cursor?: string, limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.POSTS.SEARCH({ q, cursor, limit }),
    );

    return data;
  },

  deletePost: (postId: string) => {
    return axiosInstance.delete(
      `${API_ENDPOINT.POSTS.DELETE_POST(postId)}`,
      {},
    );
  },
};
