import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import {
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
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

  forgot: (email: string) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.FORGOT, { email });
  },

  reset: (resetPasswordData: ResetPasswordData) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.RESET, resetPasswordData);
  },
};
