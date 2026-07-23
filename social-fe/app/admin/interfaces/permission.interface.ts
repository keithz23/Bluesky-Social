export interface Permissions {
  id: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
}
export interface PermissionGroups {
  id: string;
  name: string;
  description: string;
  permissions: Permissions[];
}

export interface RolePermissions {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: string;
  permissions: Permissions[];
}
