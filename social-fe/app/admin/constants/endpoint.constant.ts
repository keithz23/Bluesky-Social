export const ADMIN_API_ENDPOINT = {
  ROLES: {
    FIND_ALL: "/admin/roles",
    CREATE_ROLE: "/admin/roles",
    DELETE_ROLE: "/admin/roles",
    UPDATE_ROLE: (id: string) => `/admin/roles/${id}`,
    FIND_ONE: (id: string) => `/admin/roles/${id}`,
  },
};
