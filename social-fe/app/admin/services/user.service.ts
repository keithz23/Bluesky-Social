import { apiClient } from "@/lib/axios";
import { CreateUserData, UpdateUserData } from "../interfaces/user.interface";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";

export const UserService = {
  create: (payload: CreateUserData) => {
    return apiClient.post(ADMIN_API_ENDPOINT.USERS.CREATE_USER, payload);
  },

  update: (userId: string, payload: UpdateUserData) => {
    return apiClient.patch(
      `${ADMIN_API_ENDPOINT.USERS.UPDATE_USER(userId)}`,
      payload,
    );
  },

  delete: (userIds: string[]) => {
    return apiClient.delete(ADMIN_API_ENDPOINT.USERS.DELETE_USER, {
      data: {
        userIds: userIds,
      },
    });
  },

  findAll: (
    page: number = 1,
    limit: number = 10,
    roleIds?: string[],
    status?: string,
    search?: string,
  ) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (limit) params.set("limit", String(limit));

    if (roleIds) params.append("roleIds", roleIds.join(","));
    if (status) params.append("status", status);

    if (search) params.append("search", search);

    return apiClient.getPaginated(
      `${ADMIN_API_ENDPOINT.USERS.FIND_ALL}?${params.toString()}`,
    );
  },
};
