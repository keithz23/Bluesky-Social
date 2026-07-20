import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Notifications } from "../interfaces/notification.interface";

export const NotificationService = {
  getNotifications: async (
    filter: "all" | "mention" = "all",
    cursor?: string,
    limit?: number,
  ) => {
    return apiClient.get<{
      notifications: Notifications[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      API_ENDPOINT.NOTIFICATIONS.GET_NOTIFICATIONS({ cursor, limit, filter }),
    );
  },

  getUnreadCount: async () => {
    const data = await apiClient.get<{ count: number }>(
      API_ENDPOINT.NOTIFICATIONS.UNREAD_COUNT,
    );
    return data.count as number;
  },

  markAsRead: async (notificationId: string) => {
    return apiClient.patch<unknown>(
      API_ENDPOINT.NOTIFICATIONS.MARK_READ(notificationId),
    );
  },

  markAllAsRead: async () => {
    return apiClient.patch<unknown>(
      API_ENDPOINT.NOTIFICATIONS.MARK_ALL_READ,
    );
  },
};
