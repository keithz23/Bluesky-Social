import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import type { AxiosProgressEvent } from "axios";
import { Feed } from "../interfaces/feed.interface";

export const ReplyService = {
  createReply: async (
    postId: string,
    payload: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ) => {
    return apiClient.post<Feed>(
      API_ENDPOINT.POSTS.CREATE_REPLY(postId),
      payload,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      },
    );
  },

  getReplies: async (postId: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    return apiClient.get<{
      replies: Feed[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      `${API_ENDPOINT.POSTS.GET_REPLIES(postId)}?${params}`,
    );
  },
};
