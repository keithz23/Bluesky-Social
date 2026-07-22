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
};
