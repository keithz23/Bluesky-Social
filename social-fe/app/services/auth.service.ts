import { apiClient, refreshAuthSession } from "@/lib/axios";
import type { AxiosProgressEvent } from "axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import {
  ChangePasswordData,
  LoginCredentials,
  RequestUpdateEmailData,
  RegisterData,
  ResetPasswordData,
  UpdateEmailData,
  UpdateProfileData,
  ChangeUsernameData,
  ChangeBirthDayData,
  DeactivateAccountData,
  DeleteAccountData,
  Enable2FAData,
  Disable2FAData,
  Setup2FAData,
} from "../interfaces/auth.interface";
import { AuthResponse, LoginResponse } from "../interfaces/user.interface";
import type { User } from "../interfaces/user.interface";

export const AuthService = {
  register: (registerData: RegisterData) => {
    return apiClient.post<User>(API_ENDPOINT.AUTH.REGISTER, registerData);
  },

  login: async (crendentials: LoginCredentials): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(API_ENDPOINT.AUTH.LOGIN, crendentials);
  },

  logout: () => {
    return apiClient.post<unknown>(API_ENDPOINT.AUTH.LOGOUT, {});
  },

  refresh: async (): Promise<AuthResponse> => {
    return refreshAuthSession();
  },

  me: async (): Promise<User> => {
    return apiClient.get<User>(API_ENDPOINT.AUTH.ME);
  },

  updateProfile: async (
    updateProfileData: UpdateProfileData,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) => {
    const formData = new FormData();
    if (updateProfileData.displayName) {
      formData.append("displayName", updateProfileData.displayName);
    }
    if (updateProfileData.bio !== undefined) {
      formData.append("bio", updateProfileData.bio);
    }
    if (updateProfileData.avatarFile) {
      formData.append("avatar", updateProfileData.avatarFile);
    }
    if (updateProfileData.coverFile) {
      formData.append("cover", updateProfileData.coverFile);
    }
    return apiClient.patch<User>(
      API_ENDPOINT.AUTH.UPDATE_PROFILE,
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress },
    );
  },

  forgot: (email: string) => {
    return apiClient.post<{ message?: string; canResetPassword?: boolean }>(
      API_ENDPOINT.AUTH.FORGOT,
      { email },
    );
  },

  reset: (resetPasswordData: ResetPasswordData) => {
    return apiClient.post<{ message?: string }>(
      API_ENDPOINT.AUTH.RESET,
      resetPasswordData,
    );
  },

  requestUpdateEmail: (requestUpdateEmailData: RequestUpdateEmailData) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.AUTH.REQUEST_UPDATE_EMAIL,
      requestUpdateEmailData,
    );
  },

  updateEmail: (updateEmailData: UpdateEmailData) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.AUTH.UPDATE_EMAIL,
      updateEmailData,
    );
  },

  requestUpdatePassword: () => {
    return apiClient.post<unknown>(API_ENDPOINT.AUTH.REQUEST_UPDATE_PASSWORD);
  },

  changePassword: (changePasswordData: ChangePasswordData) => {
    return apiClient.patch<unknown>(
      API_ENDPOINT.AUTH.CHANGE_PASSWORD,
      changePasswordData,
    );
  },

  changeUsername: (changeUsernameData: ChangeUsernameData) => {
    return apiClient.patch<unknown>(
      API_ENDPOINT.AUTH.CHANGE_USERNAME,
      changeUsernameData,
    );
  },

  changeBirthDay: (changeBirthDayData: ChangeBirthDayData) => {
    return apiClient.patch<unknown>(
      API_ENDPOINT.AUTH.CHANGE_BIRTHDAY,
      changeBirthDayData,
    );
  },

  requestDeactivateAccount: () => {
    return apiClient.post<unknown>(API_ENDPOINT.AUTH.REQUEST_DEACTIVATE_ACCOUNT);
  },

  deactivateAccount: (deactivateAccountData: DeactivateAccountData) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.AUTH.DEACTIVATE_ACCOUNT,
      deactivateAccountData,
    );
  },

  requestDeleteAccount: () => {
    return apiClient.post<unknown>(API_ENDPOINT.AUTH.REQUEST_DELETE_ACCOUNT);
  },

  deleteAccount: (deleteAccountData: DeleteAccountData) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.AUTH.DELETE_ACCOUNT,
      deleteAccountData,
    );
  },

  requestEnable2FA: (setup2FAData: Setup2FAData) => {
    return apiClient.post<{ secret: string; qrCodeDataUrl: string }>(
      API_ENDPOINT.AUTH.REQUEST_ENABLE_2FA,
      setup2FAData,
    );
  },

  enable2FA: (enable2FAData: Enable2FAData) => {
    return apiClient.post<{ recoveryCodes?: string[] }>(
      API_ENDPOINT.AUTH.ENABLE_2FA,
      enable2FAData,
    );
  },

  requestDisable2FA: () => {
    return apiClient.post<unknown>(API_ENDPOINT.AUTH.REQUEST_DISABLE_2FA);
  },

  disable2FA: (disable2FAData: Disable2FAData) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.AUTH.DISABLE_2FA,
      disable2FAData,
    );
  },

  verifyLogin2FA: async (payload: {
    challengeId: string;
    otp: string;
  }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(
      API_ENDPOINT.AUTH.VERIFY_LOGIN_2FA,
      payload,
    );
  },

  getSocketToken: () => {
    return apiClient.get<{ token: string }>(API_ENDPOINT.AUTH.SOCKET_TOKEN);
  },
};
