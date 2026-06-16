import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/app/constants/endpoint.constant";
import {
  ConversationsResponse,
  MessagesResponse,
  Conversation,
  Message,
} from "@/app/interfaces/chat.interface";

export const ChatService = {
  getConversations: async (params?: {
    cursor?: string;
    limit?: number;
  }): Promise<ConversationsResponse> => {
    const response = await axiosInstance.get(
      API_ENDPOINT.CHAT.GET_CONVERSATIONS(params),
    );
    return response.data;
  },

  createConversation: async (body: {
    type: "DIRECT" | "GROUP";
    participantIds: string[];
    name?: string;
  }): Promise<Conversation> => {
    const response = await axiosInstance.post(
      API_ENDPOINT.CHAT.CREATE_CONVERSATION,
      body,
    );
    return response.data;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const response = await axiosInstance.get(
      API_ENDPOINT.CHAT.GET_CONVERSATION(id),
    );
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await axiosInstance.delete(API_ENDPOINT.CHAT.DELETE_CONVERSATION(id));
  },

  getMessages: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<MessagesResponse> => {
    const response = await axiosInstance.get(
      API_ENDPOINT.CHAT.GET_MESSAGES(conversationId, params),
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    body: { content: string; type?: string },
  ): Promise<Message> => {
    const response = await axiosInstance.post(
      API_ENDPOINT.CHAT.SEND_MESSAGE(conversationId),
      body,
    );
    return response.data;
  },

  sendMediaMessage: async (
    conversationId: string,
    body: { file: File; content?: string },
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append("file", body.file);
    if (body.content) formData.append("content", body.content);

    const response = await axiosInstance.post(
      API_ENDPOINT.CHAT.SEND_MEDIA_MESSAGE(conversationId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },
};
