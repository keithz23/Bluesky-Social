import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Feed } from "../interfaces/feed.interface";
import { updateBookmarkCache, updatePostInCaches } from "@/lib/query-util";

export const useLike = (postId: string, isLiked: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isLiked
        ? axiosInstance.delete(API_ENDPOINT.LIKES.UNLIKE(postId))
        : axiosInstance.post(API_ENDPOINT.LIKES.LIKE(postId)),

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

      updatePostInCaches(qc, allCacheKeys, postId, (p: Feed) => ({
        ...p,
        isLiked: !isLiked,
        likeCount: !isLiked ? p.likeCount + 1 : p.likeCount - 1,
      }));

      updateBookmarkCache(qc, postId, (post: Feed) => ({
        ...post,
        isLiked: !isLiked,
        likeCount: !isLiked ? post.likeCount + 1 : post.likeCount - 1,
      }));

      return { previousFeed, previousBookmarks, userPostsCache };
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
