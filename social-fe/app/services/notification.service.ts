import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const NotificationService = {
  getNotifications: async (
    filter: "all" | "mention" = "all",
    cursor?: string,
    limit?: number,
  ) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.NOTIFICATIONS.GET_NOTIFICATIONS({ cursor, limit, filter }),
    );
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.NOTIFICATIONS.UNREAD_COUNT,
    );
    return data.count as number;
  },

  markAsRead: async (notificationId: string) => {
    const { data } = await axiosInstance.patch(
      API_ENDPOINT.NOTIFICATIONS.MARK_READ(notificationId),
    );
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await axiosInstance.patch(
      API_ENDPOINT.NOTIFICATIONS.MARK_ALL_READ,
    );
    return data;
  },
};
