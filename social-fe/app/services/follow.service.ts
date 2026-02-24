import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const FollowService = {
  getFollowingLists: async (
    username: string,
    cursor?: string,
    limit?: number,
  ) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.FOLLOWS.FOLLOWING_LISTS({ cursor, limit, username }),
    );
    return data;
  },

  getFollowerLists: async (
    username: string,
    cursor?: string,
    limit?: number,
  ) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.FOLLOWS.FOLLOWER_LISTS({ cursor, limit, username }),
    );
    return data;
  },
};
