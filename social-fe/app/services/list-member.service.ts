import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const ListMemberService = {
  addMember: async (listId: string, userIdToAdd: string) => {
    const { data } = await axiosInstance.post(
      API_ENDPOINT.LISTS_MEMBER.ADD_MEMBER(listId, userIdToAdd),
      userIdToAdd,
    );
    return data;
  },

  removeMember: async (listId: string, userIdToRemove: string) => {
    const { data } = await axiosInstance.delete(
      API_ENDPOINT.LISTS_MEMBER.REMOVE_MEMBER(listId, userIdToRemove),
    );

    return data;
  },

  getMemberList: async (listId: string, cursor?: string, limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.LISTS_MEMBER.GET_LIST_MEMBER(listId, { cursor, limit }),
    );
    return data;
  },
};
