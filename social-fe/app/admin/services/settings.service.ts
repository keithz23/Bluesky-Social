import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";
import {
  SystemSetting,
  UpdateSystemSettingsPayload,
} from "../interfaces/system-setting.interface";

export const SettingsService = {
  findAll: () => apiClient.get<SystemSetting[]>(ADMIN_API_ENDPOINT.SETTINGS.BASE),

  update: (payload: UpdateSystemSettingsPayload) =>
    apiClient.patch<SystemSetting[]>(ADMIN_API_ENDPOINT.SETTINGS.BASE, payload),

  reset: () => apiClient.delete<SystemSetting[]>(ADMIN_API_ENDPOINT.SETTINGS.BASE),
};
