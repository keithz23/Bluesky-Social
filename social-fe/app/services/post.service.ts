import { axiosInstance } from "@/lib/axios";
import type { AxiosProgressEvent } from "axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

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

  updatePost: (
    postId: string,
    payload: FormData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    return axiosInstance.patch(
      `${API_ENDPOINT.POSTS.UPDATE_POST(postId)}`,
      payload,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      },
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

  pinPost: async (postId: string) => {
    return axiosInstance.post(`${API_ENDPOINT.POSTS.PIN_POST(postId)}`);
  },

  unpinPost: async (postId: string) => {
    return axiosInstance.delete(`${API_ENDPOINT.POSTS.UNPIN_POST(postId)}`);
  },

  getPinPostsByUsername: async (username: string, cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const { data } = await axiosInstance.get(
      `${API_ENDPOINT.POSTS.GET_PIN_POST(username)}?${params}`,
    );

    return data;
  },

  getPostById: async (postId: string) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.POSTS.GET_BY_ID(postId),
    );

    return data;
  },

  searchPosts: async (
    q: string,
    cursor?: string,
    limit?: number,
    options?: { ownOnly?: boolean },
  ) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.POSTS.SEARCH({ q, cursor, limit, ...options }),
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
