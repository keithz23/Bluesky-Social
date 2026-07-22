export interface CreateRoleData {
  name: string;
  description?: string;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {
  roleId: string;
}
