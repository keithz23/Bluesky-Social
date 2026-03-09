import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { CreateReplyDto } from "../interfaces/post.interface";

export const ReplyService = {
  createReply: async (postId: string, payload: CreateReplyDto) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINT.POSTS.CREATE_REPLY(postId),
      payload,
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
