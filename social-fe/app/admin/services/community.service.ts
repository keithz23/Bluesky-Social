import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";
import {
  AdminPost,
  AdminPostFilters,
  AdminReport,
  AdminReportFilters,
  ModerationDecision,
  ReportStatus,
} from "../interfaces/community.interface";

const buildParams = (filters: object) => {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") params[key] = value;
  });
  return params;
};

export const CommunityService = {
  getPosts: (filters: AdminPostFilters) =>
    apiClient.getPaginated<AdminPost[]>(ADMIN_API_ENDPOINT.POSTS.BASE, {
      params: buildParams(filters),
    }),

  setPostVisibility: (postId: string, isDeleted: boolean) =>
    apiClient.patch<AdminPost>(ADMIN_API_ENDPOINT.POSTS.DETAIL(postId), {
      isDeleted,
    }),

  getReports: (filters: AdminReportFilters) =>
    apiClient.getPaginated<AdminReport[]>(ADMIN_API_ENDPOINT.REPORTS.BASE, {
      params: buildParams(filters),
    }),

  updateReportStatus: (reportId: string, status: ReportStatus) =>
    apiClient.patch<AdminReport>(ADMIN_API_ENDPOINT.REPORTS.DETAIL(reportId), {
      status,
    }),

  getModerationQueue: (filters: AdminReportFilters) =>
    apiClient.getPaginated<AdminReport[]>(ADMIN_API_ENDPOINT.MODERATION.BASE, {
      params: buildParams(filters),
    }),

  decideReport: (reportId: string, action: ModerationDecision) =>
    apiClient.patch<AdminReport>(
      ADMIN_API_ENDPOINT.MODERATION.DECISION(reportId),
      { action },
    ),
};
