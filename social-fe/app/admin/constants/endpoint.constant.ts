export const ADMIN_API_ENDPOINT = {
  DASHBOARD: {
    BASE: "/admin/dashboard",
  },
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
  USERS: {
    CREATE_USER: "/admin/users",
    DELETE_USER: "/admin/users",
    FIND_ALL: "/admin/users",
    UPDATE_USER: (id: string) => `/admin/users/${id}`,
    FIND_ONE: (id: string) => `/admin/users/${id}`,
  },
  RULES: {
    BASE: "/admin/rules",
    ACTIVE: "/admin/rules/active",
    DETAIL: (ruleId: string) => `/admin/rules/${ruleId}`,
  },
  KEYWORDS: {
    BASE: "/admin/keywords",
    DETAIL: (keywordId: string) => `/admin/keywords/${keywordId}`,
  },
  AUDIT_LOGS: {
    FIND_ALL: "/admin/audit-logs",
    FIND_ONE: (auditLogId: string) => `/admin/audit-logs/${auditLogId}`,
  },
  POSTS: {
    BASE: "/admin/posts",
    DETAIL: (postId: string) => `/admin/posts/${postId}`,
  },
  REPORTS: {
    BASE: "/admin/reports",
    DETAIL: (reportId: string) => `/admin/reports/${reportId}`,
  },
  MODERATION: {
    BASE: "/admin/moderation",
    DECISION: (reportId: string) => `/admin/moderation/${reportId}/decision`,
  },
  SETTINGS: {
    BASE: "/admin/settings",
  },
};
