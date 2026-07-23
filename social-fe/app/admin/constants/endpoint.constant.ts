export const ADMIN_API_ENDPOINT = {
  ROLES: {
    FIND_ALL: "/admin/roles",
    CREATE_ROLE: "/admin/roles",
    DELETE_ROLE: "/admin/roles",
    UPDATE_ROLE: (id: string) => `/admin/roles/${id}`,
    FIND_ONE: (id: string) => `/admin/roles/${id}`,
  },
  PERMISSIONS: {
    FIND_ALL_GROUP: "/admin/roles/permissions",
    ASSIGN_PERMISSIONS: (roleId: string) =>
      `/admin/roles/${roleId}/permissions`,
    SYNC_PERMISSIONS: (roleId: string) => `/admin/roles/${roleId}/permissions`,
    REVOKE_PERMISSION: (roleId: string, permissionId: string) =>
      `/admin/roles/${roleId}/permissions/${permissionId}`,
  },
};
