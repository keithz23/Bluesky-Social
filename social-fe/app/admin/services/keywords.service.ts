import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";
import {
  CreateKeywordData,
  Keyword,
  KeywordsResponse,
  UpdateKeywordData,
} from "../interfaces/keyword.interface";

export const KeywordsService = {
  create: (payload: CreateKeywordData) => {
    return apiClient.post<Keyword>(ADMIN_API_ENDPOINT.KEYWORDS.BASE, payload);
  },

  update: (keywordId: string, payload: UpdateKeywordData) => {
    return apiClient.patch<Keyword>(
      ADMIN_API_ENDPOINT.KEYWORDS.DETAIL(keywordId),
      payload,
    );
  },

  getAll: (
    page: number,
    limit: number,
    search?: string,
    action?: string,
    ruleId?: string,
  ) => {
    const params: Record<string, string | number> = { page, limit };
    if (search) params.search = search;
    if (action && action !== "all") params.action = action;
    if (ruleId) params.ruleId = ruleId;

    return apiClient.getPaginated<KeywordsResponse>(
      ADMIN_API_ENDPOINT.KEYWORDS.BASE,
      {
        params,
      },
    );
  },

  getOne: (keywordId: string) => {
    return apiClient.get<Keyword>(
      `${ADMIN_API_ENDPOINT.KEYWORDS.DETAIL(keywordId)}`,
    );
  },

  deleteMany: (keywordIds: string[]) => {
    return apiClient.delete<unknown>(ADMIN_API_ENDPOINT.KEYWORDS.BASE, {
      data: { keywordIds },
    });
  },
};
