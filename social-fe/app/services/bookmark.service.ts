import { apiClient } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Feed } from "../interfaces/feed.interface";
import { User } from "../interfaces/user.interface";

export const BookmarkService = {
  bookmark: (postId: string) => {
    return apiClient.post<unknown>(API_ENDPOINT.BOOKMARKS.BOOKMARK(postId));
  },

  unBookMark: (postId: string) => {
    return apiClient.delete<unknown>(API_ENDPOINT.BOOKMARKS.UNBOOKMARK(postId));
  },

  getBookMarks: async () => {
    return apiClient.get<Array<{ post: Feed; user?: User }>>(
      API_ENDPOINT.BOOKMARKS.GET_BOOKMARKS,
    );
  },
};
