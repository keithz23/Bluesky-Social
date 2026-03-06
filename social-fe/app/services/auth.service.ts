import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import {
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UpdateProfileData,
} from "../interfaces/auth.interface";

export const AuthService = {
  register: (registerData: RegisterData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REGISTER, registerData);
  },

  login: (crendentials: LoginCredentials) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.LOGIN, crendentials);
  },

  logout: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.LOGOUT, {});
  },

  refresh: () => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REFRESH);
  },

  me: () => {
    return axiosInstance.get(API_ENDPOINT.AUTH.ME);
  },

  updateProfile: async (updateProfileData: UpdateProfileData) => {
    const formData = new FormData();
    if (updateProfileData.username) {
      formData.append("username", updateProfileData.username);
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
