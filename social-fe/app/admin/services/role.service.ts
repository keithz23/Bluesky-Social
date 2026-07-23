import { apiClient } from "@/lib/axios";
import { CreateRoleData, UpdateRoleData } from "../interfaces/role.interface";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";

export const RoleService = {
  createRole: (payload: CreateRoleData) => {
    return apiClient.post(ADMIN_API_ENDPOINT.ROLES.CREATE_ROLE, payload);
  },

  updateRole: (id: string, payload: UpdateRoleData) => {
    return apiClient.patch(ADMIN_API_ENDPOINT.ROLES.UPDATE_ROLE(id), payload);
  },

  deleteRoles: (roleIds: string[]) => {
    return apiClient.delete(ADMIN_API_ENDPOINT.ROLES.DELETE_ROLE, {
      data: {
        roleIds: roleIds,
      },
    });
  },

  findAllRoles: async (page: number = 1, limit: number = 20) => {
    const params = new URLSearchParams();

    params.set("page", page.toString());
    params.set("limit", limit.toString());

    return apiClient.getPaginated(
      `${ADMIN_API_ENDPOINT.ROLES.FIND_ALL}?${params.toString()}`,
    );
  },
};
