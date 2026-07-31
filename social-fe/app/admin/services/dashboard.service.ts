import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";
import { AdminDashboard, DashboardRange } from "../interfaces/dashboard.interface";

export const DashboardService = {
  getOverview: (range: DashboardRange) =>
    apiClient.get<AdminDashboard>(ADMIN_API_ENDPOINT.DASHBOARD.BASE, {
      params: { range },
    }),
};
