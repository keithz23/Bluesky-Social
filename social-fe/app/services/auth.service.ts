import { apiClient, refreshAuthSession } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import {
  ChangePasswordData,
  LoginCredentials,
  RequestUpdateEmailData,
  RegisterData,
  ResetPasswordData,
  UpdateEmailData,
  DeactivateAccountData,
  DeleteAccountData,
  Enable2FAData,
  Disable2FAData,
  Setup2FAData,
} from "../interfaces/auth.interface";
import type {
  AuthSessionResponse,
  CurrentSessionResponse,
  LoginResponse,
  RegisterResponse,
} from "../interfaces/auth-response.interface";

export const AuthService = {
  register: (registerData: RegisterData) => {
    return apiClient.post<RegisterResponse>(
      API_ENDPOINT.AUTH.REGISTER,
      registerData,
    );
  },

  login: async (crendentials: LoginCredentials): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(API_ENDPOINT.AUTH.LOGIN, crendentials);
  },

  logout: () => {
    return apiClient.post<unknown>(API_ENDPOINT.AUTH.LOGOUT, {});
  },

  refresh: async (): Promise<AuthSessionResponse> => {
    return refreshAuthSession();
  },

  me: async (): Promise<CurrentSessionResponse> => {
    return apiClient.get<CurrentSessionResponse>(API_ENDPOINT.AUTH.ME);
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

  requestDeactivateAccount: () => {
    return apiClient.post<unknown>(
      API_ENDPOINT.AUTH.REQUEST_DEACTIVATE_ACCOUNT,
    );
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
  }): Promise<AuthSessionResponse> => {
    return apiClient.post<AuthSessionResponse>(
      API_ENDPOINT.AUTH.VERIFY_LOGIN_2FA,
      payload,
    );
  },

  getSocketToken: () => {
    return apiClient.get<{ token: string }>(API_ENDPOINT.AUTH.SOCKET_TOKEN);
  },
};
