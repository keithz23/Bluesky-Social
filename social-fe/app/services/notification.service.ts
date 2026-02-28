import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const NotificationService = {
  getNotifications: async (cursor?: string, limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.NOTIFICATIONS.GET_NOTIFICATIONS({ cursor, limit }),
    );
    return data;
  },
};
