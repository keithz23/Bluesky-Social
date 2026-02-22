import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { updatePostInCaches, updateBookmarkCache } from "@/lib/query-util";

export const useRepost = (postId: string, isReposted: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isReposted
        ? axiosInstance.delete(API_ENDPOINT.REPOSTS.UNREPOST(postId))
        : axiosInstance.post(API_ENDPOINT.REPOSTS.REPOST(postId)),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["userPosts"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });
      await qc.cancelQueries({ queryKey: ["reposts"] });

      const previousFeed = qc.getQueryData(["feed"]);
      const previousBookmarks = qc.getQueryData(["bookmarks"]);
      const previousReposts = qc.getQueryData(["reposts"]);
      const userPostsCache = qc.getQueriesData({ queryKey: ["userPosts"] });

      const allCacheKeys = [
        ["feed"],
        ["reposts"],
        ...userPostsCache.map(([key]) => key as any[]),
      ];

      updatePostInCaches(qc, allCacheKeys, postId, (p) => ({
        ...p,
        isReposted: !isReposted,
        repostCount: !isReposted ? p.repostCount + 1 : p.repostCount - 1,
      }));

      updateBookmarkCache(qc, postId, (post) => ({
        ...post,
        isReposted: !isReposted,
        repostCount: !isReposted ? post.repostCount + 1 : post.repostCount - 1,
      }));

      return {
        previousFeed,
        previousBookmarks,
        previousReposts,
        userPostsCache,
      };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousFeed)
        qc.setQueryData(["feed"], context.previousFeed);
      if (context?.previousBookmarks)
        qc.setQueryData(["bookmarks"], context.previousBookmarks);
      if (context?.previousReposts)
        qc.setQueryData(["reposts"], context.previousReposts);
      context?.userPostsCache?.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
    },
  });
};
