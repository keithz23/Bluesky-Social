import { useQuery } from "@tanstack/react-query";
import { AuditLogFilters } from "../interfaces/audit-log.interface";
import { AuditLogService } from "../services/audit-log.service";

export const useAuditLogs = (filters: AuditLogFilters) =>
  useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => AuditLogService.findAll(filters),
    placeholderData: (previousData) => previousData,
    // Keep the audit stream current while this tab is visible. React Query
    // pauses this timer in background tabs by default.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
