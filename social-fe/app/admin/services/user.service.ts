import { apiClient } from "@/lib/axios";
import { CreateUserData } from "../interfaces/user.interface";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";

export const UserService = {
  create: (payload: CreateUserData) => {
    return apiClient.post(ADMIN_API_ENDPOINT.USERS.CREATE_USER, payload);
  },
  findAll: (page: number = 1, limit: number = 10) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));

    return apiClient.getPaginated(
      `${ADMIN_API_ENDPOINT.USERS.FIND_ALL}?${params.toString()}`,
    );
  },
};
