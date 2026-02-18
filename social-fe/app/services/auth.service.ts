import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const AuthService = {
  register: (registerData: any) => {
    return axiosInstance.post(API_ENDPOINT.AUTH.REGISTER, registerData);
  },

  login: (crendentials: any) => {
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
};
