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
};
