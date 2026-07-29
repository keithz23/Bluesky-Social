import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export interface Rule {
  id: string;
  title: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isActive: boolean;
  displayOrder: number;
}

export const ModerationService = {
  blockUser: async (userId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.MODERATION.BLOCK_USER(userId));
  },

  unblockUser: async (userId: string) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.MODERATION.UNBLOCK_USER(userId),
    );
  },

  muteUser: async (userId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.MODERATION.MUTE_USER(userId));
  },

  unmuteUser: async (userId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.MODERATION.UNMUTE_USER(userId));
  },

  reportPost: async ({
    postId,
    ruleId,
    details,
  }: {
    postId: string;
    ruleId: string;
    details?: string;
  }) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.MODERATION.REPORT_POST(postId),
      { ruleId, details },
    );
  },
};
