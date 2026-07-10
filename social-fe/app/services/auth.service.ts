import { axiosInstance, refreshAuthSession } from "@/lib/axios";
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
  Enable2FAData,
  Disable2FAData,
} from "../interfaces/auth.interface";
import { AuthResponse, LoginResponse } from "../interfaces/user.interface";
import type { User } from "../interfaces/user.interface";

export const AuthService = {
  register: (registerData: RegisterData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REGISTER, registerData);
  },

  login: async (crendentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await axiosInstance.post(
      API_ENDPOINT.AUTH.LOGIN,
      crendentials,
    );
    return response.data;
  },

  logout: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.LOGOUT, {});
  },

  refresh: async (): Promise<AuthResponse> => {
    return refreshAuthSession();
  },

  me: async (): Promise<User> => {
    const response = await axiosInstance.get(API_ENDPOINT.AUTH.ME);
    return response.data ?? response;
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
    const { data } = await axiosInstance.patch(
      API_ENDPOINT.AUTH.UPDATE_PROFILE,
      formData,
      { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress },
    );
    return data;
  },

  forgot: (email: string) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.FORGOT, { email });
  },

  reset: (resetPasswordData: ResetPasswordData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.RESET, resetPasswordData);
  },

  requestUpdateEmail: (requestUpdateEmailData: RequestUpdateEmailData) => {
    return axiosInstance.post(
      API_ENDPOINT.AUTH.REQUEST_UPDATE_EMAIL,
      requestUpdateEmailData,
    );
  },

  updateEmail: (updateEmailData: UpdateEmailData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.UPDATE_EMAIL, updateEmailData);
  },

  requestUpdatePassword: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REQUEST_UPDATE_PASSWORD);
  },

  changePassword: (changePasswordData: ChangePasswordData) => {
    return axiosInstance.patch(
      API_ENDPOINT.AUTH.CHANGE_PASSWORD,
      changePasswordData,
    );
  },

  changeUsername: (changeUsernameData: ChangeUsernameData) => {
    return axiosInstance.patch(
      API_ENDPOINT.AUTH.CHANGE_USERNAME,
      changeUsernameData,
    );
  },

  changeBirthDay: (changeBirthDayData: ChangeBirthDayData) => {
    return axiosInstance.patch(
      API_ENDPOINT.AUTH.CHANGE_BIRTHDAY,
      changeBirthDayData,
    );
  },

  requestDeactivateAccount: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REQUEST_DEACTIVATE_ACCOUNT);
  },

  deactivateAccount: (deactivateAccountData: DeactivateAccountData) => {
    return axiosInstance.post(
      API_ENDPOINT.AUTH.DEACTIVATE_ACCOUNT,
      deactivateAccountData,
    );
  },

  requestEnable2FA: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REQUEST_ENABLE_2FA);
  },

  enable2FA: (enable2FAData: Enable2FAData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.ENABLE_2FA, enable2FAData);
  },

  requestDisable2FA: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REQUEST_DISABLE_2FA);
  },

  disable2FA: (disable2FAData: Disable2FAData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.DISABLE_2FA, disable2FAData);
  },

  verifyLogin2FA: async (payload: {
    challengeId: string;
    otp: string;
  }): Promise<AuthResponse> => {
    const response = await axiosInstance.post(
      API_ENDPOINT.AUTH.VERIFY_LOGIN_2FA,
      payload,
    );
    return response.data;
  },
};
