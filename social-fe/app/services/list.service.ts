import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { CreateListData, UpdateList } from "../interfaces/list.interface";

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

    const { data } = await axiosInstance.post(
      API_ENDPOINT.LISTS.CREATE_LIST,
      formData,
    );

    return data;
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
    const { data } = await axiosInstance.patch(
      API_ENDPOINT.LISTS.UPDATE_LIST,
      formData,
    );
    return data;
  },

  deleteList: async (id: string) => {
    const { data } = await axiosInstance.delete(
      API_ENDPOINT.LISTS.DELETE_LIST(id),
      {},
    );
    return data;
  },

  getLists: async (cursor?: string, limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.LISTS.GET_LISTS({ cursor, limit }),
    );
    return data;
  },

  getListById: async (id: string) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.LISTS.GET_LIST_BY_ID(id),
    );
    return { data };
  },
};
