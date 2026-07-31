import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";
import { AuditLog, AuditLogFilters } from "../interfaces/audit-log.interface";

export const AuditLogService = {
  findAll: (filters: AuditLogFilters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });

    const query = params.toString();
    return apiClient.getPaginated<AuditLog[]>(
      `${ADMIN_API_ENDPOINT.AUDIT_LOGS.FIND_ALL}${query ? `?${query}` : ""}`,
    );
  },

  findOne: (auditLogId: string) =>
    apiClient.get<AuditLog>(ADMIN_API_ENDPOINT.AUDIT_LOGS.FIND_ONE(auditLogId)),
};
