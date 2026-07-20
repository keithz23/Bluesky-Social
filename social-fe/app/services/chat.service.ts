import { apiClient } from "@/lib/axios";
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
    return apiClient.get<ConversationsResponse>(
      API_ENDPOINT.CHAT.GET_CONVERSATIONS(params),
    );
  },

  createConversation: async (body: {
    type: "DIRECT" | "GROUP";
    participantIds: string[];
    name?: string;
  }): Promise<Conversation> => {
    return apiClient.post<Conversation>(
      API_ENDPOINT.CHAT.CREATE_CONVERSATION,
      body,
    );
  },

  getConversation: async (id: string): Promise<Conversation> => {
    return apiClient.get<Conversation>(
      API_ENDPOINT.CHAT.GET_CONVERSATION(id),
    );
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete<unknown>(API_ENDPOINT.CHAT.DELETE_CONVERSATION(id));
  },

  getMessages: async (
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<MessagesResponse> => {
    return apiClient.get<MessagesResponse>(
      API_ENDPOINT.CHAT.GET_MESSAGES(conversationId, params),
    );
  },

  sendMessage: async (
    conversationId: string,
    body: { content: string; type?: string },
  ): Promise<Message> => {
    return apiClient.post<Message>(
      API_ENDPOINT.CHAT.SEND_MESSAGE(conversationId),
      body,
    );
  },

  sendMediaMessage: async (
    conversationId: string,
    body: { file: File; content?: string },
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append("file", body.file);
    if (body.content) formData.append("content", body.content);

    return apiClient.post<Message>(
      API_ENDPOINT.CHAT.SEND_MEDIA_MESSAGE(conversationId),
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },
};
