export interface CreateUserData {
  username: string;
  email: string;
  password?: string;
  dateOfBirth?: string;
  roleIds: string[];
}

export interface UpdateUserData {
  username: string;
  email: string;
  password?: string;
  dateOfBirth?: string;
  roleIds: string[];
}
