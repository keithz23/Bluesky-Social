import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { rollbackPostCaches, snapshotPostCaches, updatePostEverywhere } from "../utils/post-cache.util";

export const useGetBookmarks = () => {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const { data } = await axiosInstance.get(
        API_ENDPOINT.BOOKMARKS.GET_BOOKMARKS,
      );
      return data;
    },
  });
};

export const useBookmark = (postId: string, isBookmarked: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isBookmarked
        ? axiosInstance.delete(API_ENDPOINT.BOOKMARKS.UNBOOKMARK(postId))
        : axiosInstance.post(API_ENDPOINT.BOOKMARKS.BOOKMARK(postId)),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["userPosts"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });

      const snapshot = snapshotPostCaches(qc);

      updatePostEverywhere(qc, postId, (post) => ({
        ...post,
        isBookmarked: !isBookmarked,
        bookmarkCount: Math.max(0, post.bookmarkCount + (!isBookmarked ? 1 : -1)),
      }))

      return snapshot;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot) rollbackPostCaches(qc, snapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["post-detail"] });
    },
  });
};
