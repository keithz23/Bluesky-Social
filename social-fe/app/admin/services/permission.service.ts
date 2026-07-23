import { apiClient } from "@/lib/axios";
import { ADMIN_API_ENDPOINT } from "../constants/endpoint.constant";

export const PermissionService = {
  findAllPermissionGroup: () => {
    return apiClient.get(ADMIN_API_ENDPOINT.PERMISSIONS.FIND_ALL_GROUP);
  },

  assignPermissions: (roleId: string, permissionIds: string[]) => {
    return apiClient.post(
      `${ADMIN_API_ENDPOINT.PERMISSIONS.ASSIGN_PERMISSIONS(roleId)}`,
      { permissionIds },
    );
  },

  syncPermissions: (roleId: string, permissionIds: string[]) => {
    return apiClient.put(
      `${ADMIN_API_ENDPOINT.PERMISSIONS.SYNC_PERMISSIONS(roleId)}`,
      { permissionIds },
    );
  },

  revokePermission: (roleId: string, permissionId: string) => {
    return apiClient.delete(
      `${ADMIN_API_ENDPOINT.PERMISSIONS.REVOKE_PERMISSION(roleId, permissionId)}`,
    );
  },
};
