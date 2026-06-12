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
  displayName?: string;
  bio?: string;
  avatarFile?: File;
  coverFile?: File;
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

export interface ChangeUsernameData {
  username: string;
}

export interface ChangeBirthDayData {
  dateOfBirth: string;
}
