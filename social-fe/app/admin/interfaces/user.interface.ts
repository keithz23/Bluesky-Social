export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string | Date;
  rolesId: string[];
}
