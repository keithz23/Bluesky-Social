import { useQuery } from "@tanstack/react-query";
import { DashboardRange } from "../interfaces/dashboard.interface";
import { DashboardService } from "../services/dashboard.service";

export const useDashboard = (range: DashboardRange) =>
  useQuery({
    queryKey: ["admin-dashboard", range],
    queryFn: () => DashboardService.getOverview(range),
    staleTime: 20_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
