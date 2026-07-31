import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrMsg } from "@/app/utils/error.util";
import {
  AdminPostFilters,
  AdminReportFilters,
  ModerationDecision,
  ReportStatus,
} from "../interfaces/community.interface";
import { CommunityService } from "../services/community.service";

export const useAdminPosts = (filters: AdminPostFilters) =>
  useQuery({
    queryKey: ["admin-posts", filters],
    queryFn: () => CommunityService.getPosts(filters),
    placeholderData: (previousData) => previousData,
  });

export const useAdminReports = (filters: AdminReportFilters) =>
  useQuery({
    queryKey: ["admin-reports", filters],
    queryFn: () => CommunityService.getReports(filters),
    placeholderData: (previousData) => previousData,
  });

export const useModerationQueue = (filters: AdminReportFilters) =>
  useQuery({
    queryKey: ["moderation-queue", filters],
    queryFn: () => CommunityService.getModerationQueue(filters),
    placeholderData: (previousData) => previousData,
  });

export function useCommunityMutations() {
  const queryClient = useQueryClient();
  const invalidateCommunity = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
    queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
  };

  const visibilityMutation = useMutation({
    mutationFn: ({ postId, isDeleted }: { postId: string; isDeleted: boolean }) =>
      CommunityService.setPostVisibility(postId, isDeleted),
    onSuccess: (_, variables) => {
      toast.success(variables.isDeleted ? "Post hidden" : "Post restored");
      invalidateCommunity();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const reportStatusMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: ReportStatus }) =>
      CommunityService.updateReportStatus(reportId, status),
    onSuccess: () => {
      toast.success("Report status updated");
      invalidateCommunity();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const moderationMutation = useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: ModerationDecision }) =>
      CommunityService.decideReport(reportId, action),
    onSuccess: (_, variables) => {
      const labels: Record<ModerationDecision, string> = {
        HIDE: "Post hidden and report resolved",
        RESTORE: "Post restored and report resolved",
        RESOLVE: "Report resolved",
        DISMISS: "Report dismissed",
      };
      toast.success(labels[variables.action]);
      invalidateCommunity();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  return { visibilityMutation, reportStatusMutation, moderationMutation };
}
