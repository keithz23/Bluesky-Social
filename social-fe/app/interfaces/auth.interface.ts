export interface RegisterData {
  email: string;
  password: string;
  dateOfBirth: string;
}

export interface LoginCredentials {
  account: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  code: string;
  newPassword: string;
}

export interface UpdateProfileData {
  email: string;
  password: string;
  dateOfBirth: string;
}
