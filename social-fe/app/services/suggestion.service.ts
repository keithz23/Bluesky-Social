import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { User } from "../interfaces/user.interface";

export const SuggestionsService = {
  getSuggestedUsers: async (limit?: number) => {
    return apiClient.get<User[]>(
      API_ENDPOINT.SUGGESTIONS.GET_USERS(limit),
    );
  },
};
