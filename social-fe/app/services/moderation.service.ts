import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "VIOLENCE"
  | "NUDITY"
  | "FALSE_INFORMATION"
  | "IMPERSONATION"
  | "OTHER";

export const ModerationService = {
  blockUser: async (userId: string) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.MODERATION.BLOCK_USER(userId),
    );
  },

  muteUser: async (userId: string) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.MODERATION.MUTE_USER(userId),
    );
  },

  reportPost: async ({
    postId,
    reason,
    details,
  }: {
    postId: string;
    reason: ReportReason;
    details?: string;
  }) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.MODERATION.REPORT_POST(postId),
      { reason, details },
    );
  },
};
