export interface CreateRoleData {
  name: string;
  level: number;
  description?: string;
}

export interface UpdateRoleData extends Partial<CreateRoleData> {}
