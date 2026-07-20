import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const ListMemberService = {
  addMember: async (listId: string, userIdToAdd: string) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.LISTS_MEMBER.ADD_MEMBER(listId, userIdToAdd),
    );
  },

  removeMember: async (listId: string, userIdToRemove: string) => {
    return apiClient.delete<unknown>(
      API_ENDPOINT.LISTS_MEMBER.REMOVE_MEMBER(listId, userIdToRemove),
    );
  },

  getMemberList: async (listId: string, cursor?: string, limit?: number) => {
    return apiClient.get<{
      members: Array<{
        id: string;
        listId: string;
        addedAt: string;
        user: {
          id: string;
          username: string;
          displayName: string;
          bio?: string;
          avatarUrl?: string;
          coverUrl?: string;
        };
      }>;
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      API_ENDPOINT.LISTS_MEMBER.GET_LIST_MEMBER(listId, { cursor, limit }),
    );
  },
};
