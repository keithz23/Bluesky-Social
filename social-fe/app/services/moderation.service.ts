import { axiosInstance } from "@/lib/axios";
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
    const { data } = await axiosInstance.post(
      API_ENDPOINT.MODERATION.BLOCK_USER(userId),
    );
    return data;
  },

  muteUser: async (userId: string) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINT.MODERATION.MUTE_USER(userId),
    );
    return data;
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
    const { data } = await axiosInstance.post(
      API_ENDPOINT.MODERATION.REPORT_POST(postId),
      { reason, details },
    );
    return data;
  },
};
