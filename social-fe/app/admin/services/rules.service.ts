import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";
import {
  CreateRulePayload,
  Rule,
  RuleListResponse,
  UpdateRulePayload,
} from "../interfaces/rule.interface";

export const RulesService = {
  getActiveRules: async () => {
    return apiClient.get<Rule[]>(ADMIN_API_ENDPOINT.RULES.ACTIVE);
  },

  getAll: async (
    page: number,
    limit: number,
    search?: string,
    severity?: string,
    status?: string,
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (severity && severity !== "all") params.severity = severity;
    if (status && status !== "all") params.status = status;

    return apiClient.getPaginated<RuleListResponse>(
      ADMIN_API_ENDPOINT.RULES.BASE,
      {
        params,
      },
    );
  },
  getOne: async (ruleId: string) => {
    return apiClient.get<Rule>(ADMIN_API_ENDPOINT.RULES.DETAIL(ruleId));
  },

  create: async (payload: CreateRulePayload) => {
    return apiClient.post<Rule>(ADMIN_API_ENDPOINT.RULES.BASE, payload);
  },

  update: async (ruleId: string, payload: UpdateRulePayload) => {
    return apiClient.patch<Rule>(
      ADMIN_API_ENDPOINT.RULES.DETAIL(ruleId),
      payload,
    );
  },

  deleteMany: async (ruleIds: string[]) => {
    return apiClient.delete<unknown>(ADMIN_API_ENDPOINT.RULES.BASE, {
      data: { ruleIds },
    });
  },
};
