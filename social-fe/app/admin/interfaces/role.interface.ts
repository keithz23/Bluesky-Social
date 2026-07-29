export interface CreateRoleData {
  name: string;
  level: number;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface UpdateRoleData extends Partial<CreateRoleData> {}
