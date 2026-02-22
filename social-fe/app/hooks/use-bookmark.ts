import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { updatePostInCaches } from "@/lib/query-util";

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

      const previousFeed = qc.getQueryData(["feed"]);
      const previousBookmarks = qc.getQueryData(["bookmarks"]);
      const userPostsCache = qc.getQueriesData({ queryKey: ["userPosts"] });

      const allCacheKeys = [
        ["feed"],
        ...userPostsCache.map(([key]) => key as any[]),
      ];

      updatePostInCaches(qc, allCacheKeys, postId, (p) => ({
        ...p,
        isBookmarked: !isBookmarked,
        bookmarkCount: !isBookmarked
          ? p.bookmarkCount + 1
          : p.bookmarkCount - 1,
      }));

      qc.setQueryData(["bookmarks"], (old: any) => {
        if (!old) return old;
        return isBookmarked
          ? old.filter((b: any) => b.post.id !== postId)
          : old;
      });

      return { previousFeed, previousBookmarks, userPostsCache };
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },

    onError: (_err, _vars, context) => {
      if (context?.previousFeed)
        qc.setQueryData(["feed"], context.previousFeed);
      if (context?.previousBookmarks)
        qc.setQueryData(["bookmarks"], context.previousBookmarks);
      context?.userPostsCache?.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
  });
};
