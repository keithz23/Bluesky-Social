import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const SuggestionsService = {
  getSuggestedUsers: async (limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.SUGGESTIONS.GET_USERS(limit)
    );
    return data;
  },
};