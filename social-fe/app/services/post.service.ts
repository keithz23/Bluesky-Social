import { apiClient } from "@/lib/axios";
import type { AxiosProgressEvent } from "axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Feed } from "../interfaces/feed.interface";

export const PostService = {
  createPost: (
    payload: FormData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    return apiClient.post<Feed>(API_ENDPOINT.POSTS.CREATE_POST, payload, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
  },

  updatePost: (
    postId: string,
    payload: FormData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    return apiClient.patch<Feed>(
      API_ENDPOINT.POSTS.UPDATE_POST(postId),
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

    return apiClient.get<{
      posts: Feed[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`${API_ENDPOINT.POSTS.GET_BY_USERNAME(username)}?${params}`);
  },

  pinPost: async (postId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.POSTS.PIN_POST(postId));
  },

  unpinPost: async (postId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.POSTS.UNPIN_POST(postId));
  },

  getPinPostsByUsername: async (username: string, cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    return apiClient.get<{
      posts: Feed[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      `${API_ENDPOINT.POSTS.GET_PIN_POST(username)}?${params}`,
    );
  },

  getPostById: async (postId: string) => {
    return apiClient.get<Feed>(API_ENDPOINT.POSTS.GET_BY_ID(postId));
  },

  searchPosts: async (
    q: string,
    cursor?: string,
    limit?: number,
    options?: { ownOnly?: boolean },
  ) => {
    return apiClient.get<{
      posts: Feed[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(API_ENDPOINT.POSTS.SEARCH({ q, cursor, limit, ...options }));
  },

  deletePost: (postId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.POSTS.DELETE_POST(postId));
  },
};
