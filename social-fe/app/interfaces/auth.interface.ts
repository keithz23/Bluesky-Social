export interface RegisterData {
  username: string;
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

export interface RequestUpdateEmailData {
  newEmail: string;
}

export interface UpdateEmailData {
  otp: string;
}

export interface ChangePasswordData {
  otp: string;
  newPassword: string;
}

export interface DeactivateAccountData {
  otp: string;
}

export interface DeleteAccountData {
  otp: string;
}

export interface Enable2FAData {
  otp: string;
}

export interface Disable2FAData {
  password: string;
  otp: string;
}

export interface Setup2FAData {
  password: string;
}
