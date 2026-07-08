import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import type { AxiosProgressEvent } from "axios";

export const ReplyService = {
  createReply: async (
    postId: string,
    payload: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  ) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINT.POSTS.CREATE_REPLY(postId),
      payload,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      },
    );

    return data;
  },

  getReplies: async (postId: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    const { data } = await axiosInstance.get(
      `${API_ENDPOINT.POSTS.GET_REPLIES(postId)}?${params}`,
    );
    return data;
  },
};
