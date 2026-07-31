export interface Permission {
  id: string;
  displayName: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  groupId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface RolePermissions {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt?: string;
  permission: Permission;
}

export interface RolesReponse {
  id: string;
  name: string;
  description: string | null;
  level: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    userRoles?: number;
    rolePermissions?: number;
  };
  rolePermissions: RolePermissions[];
}
