import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { User } from "../interfaces/user.interface";

export const UserService = {
  getProfile: async (username: string) => {
    return apiClient.get<User>(
      API_ENDPOINT.USERS.GET_PROFILE(username),
    );
  },

  searchUsers: async (query: string, limit: number = 10, listId?: string) => {
    return apiClient.get<User[]>(
      API_ENDPOINT.USERS.SEARCH(query, limit, listId),
    );
  },
};
