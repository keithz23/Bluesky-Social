import { axiosInstance, refreshAuthSession } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import {
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UpdateProfileData,
} from "../interfaces/auth.interface";
import { AuthResponse } from "../interfaces/user.interface";

export const AuthService = {
  register: (registerData: RegisterData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REGISTER, registerData);
  },

  login: async (crendentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post(API_ENDPOINT.AUTH.LOGIN, crendentials);
    return response.data
  },

  logout: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.LOGOUT, {});
  },

  refresh: async (): Promise<AuthResponse> => {
    return refreshAuthSession();
  },

  me: () => {
    return axiosInstance.get(API_ENDPOINT.AUTH.ME);
  },

  updateProfile: async (updateProfileData: UpdateProfileData) => {
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
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
  },

  forgot: (email: string) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.FORGOT, { email });
  },

  reset: (resetPasswordData: ResetPasswordData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.RESET, resetPasswordData);
  },
};
