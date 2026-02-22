import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const BookmarkService = {
  bookmark: (postId: string) => {
    return axiosInstance.post(API_ENDPOINT.BOOKMARKS.BOOKMARK(postId));
  },

  unBookMark: (postId: string) => {
    return axiosInstance.post(API_ENDPOINT.BOOKMARKS.UNBOOKMARK(postId));
  },

  getBookMarks: async () => {
    const { data } = await axiosInstance.get(
      API_ENDPOINT.BOOKMARKS.GET_BOOKMARKS,
    );
    return data;
  },
};
