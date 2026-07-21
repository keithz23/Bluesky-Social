import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { SuggestionsUser } from "../interfaces/suggestion.interface";

export const SuggestionsService = {
  getSuggestedUsers: async (limit?: number) => {
    return apiClient.get<SuggestionsUser[]>(
      API_ENDPOINT.SUGGESTIONS.GET_USERS(limit),
    );
  },
};
