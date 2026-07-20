import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { CreateListData, List, UpdateList } from "../interfaces/list.interface";

export const ListService = {
  createList: async (payload: CreateListData) => {
    const formData = new FormData();

    formData.append("name", payload.name);

    if (payload.description) {
      formData.append("description", payload.description);
    }

    if (payload.listFile) {
      formData.append("listFile", payload.listFile);
    }

    return apiClient.post<List>(
      API_ENDPOINT.LISTS.CREATE_LIST,
      formData,
    );
  },

  updateList: async (payload: UpdateList) => {
    const formData = new FormData();

    formData.append("name", payload.name);
    formData.append("listId", payload.listId);

    if (payload.description) {
      formData.append("description", payload.description);
    }

    if (payload.listFile) {
      formData.append("listFile", payload.listFile);
    }
    return apiClient.patch<List>(
      API_ENDPOINT.LISTS.UPDATE_LIST,
      formData,
    );
  },

  deleteList: async (id: string) => {
    return apiClient.delete<unknown>(
      API_ENDPOINT.LISTS.DELETE_LIST(id),
    );
  },

  getLists: async (cursor?: string, limit?: number, username?: string) => {
    return apiClient.get<{
      lists: List[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(
      API_ENDPOINT.LISTS.GET_LISTS({ cursor, limit, username }),
    );
  },

  getListById: async (id: string) => {
    return apiClient.get<List>(
      API_ENDPOINT.LISTS.GET_LIST_BY_ID(id),
    );
  },

  addPostToList: async (listId: string, postId: string) => {
    return apiClient.post<unknown>(
      API_ENDPOINT.LISTS.ADD_POST(listId, postId),
    );
  },

  removePostFromList: async (listId: string, postId: string) => {
    return apiClient.delete<unknown>(
      API_ENDPOINT.LISTS.REMOVE_POST(listId, postId),
    );
  },
};
