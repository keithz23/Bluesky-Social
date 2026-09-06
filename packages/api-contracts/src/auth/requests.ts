export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
}

export interface LoginRequest {
  account: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  newPassword: string;
}

export interface RequestUpdateEmailRequest {
  newEmail: string;
}

export interface UpdateEmailRequest {
  otp: string;
}

export interface ChangePasswordRequest {
  otp: string;
  newPassword: string;
}

export interface DeactivateAccountRequest {
  otp: string;
}

export interface DeleteAccountRequest {
  otp: string;
}

export interface Setup2FARequest {
  password: string;
}

export interface Enable2FARequest {
  otp: string;
}

export interface Disable2FARequest {
  password: string;
  code?: string;
  otp?: string;
}

export interface VerifyLogin2FARequest {
  challengeId: string;
  otp: string;
  method?: "totp" | "recovery_code";
}
