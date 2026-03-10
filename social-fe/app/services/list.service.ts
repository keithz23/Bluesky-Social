import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { CreateListData } from "../interfaces/list.interface";

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

    console.log(JSON.stringify(formData));

    const { data } = await axiosInstance.post(
      API_ENDPOINT.LISTS.CREATE_LIST,
      formData,
    );

    return data;
  },

  getLists: async (cursor?: string, limit?: number) => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.LISTS.GET_LISTS({ cursor, limit }),
    );
    return data;
  },
};
