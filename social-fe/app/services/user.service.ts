import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const UserService = {
  getProfile: async (username: string) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.USERS.GET_PROFILE(username),
    );
    return data;
  },
};
