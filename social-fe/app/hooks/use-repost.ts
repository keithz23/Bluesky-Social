import { axiosInstance } from "@/lib/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINT } from "../constants/endpoint.constant";

export const useRepost = (postId: string, isReposted: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isReposted
        ? axiosInstance.delete(API_ENDPOINT.REPOSTS.UNREPOST(postId))
        : axiosInstance.post(API_ENDPOINT.REPOSTS.REPOST(postId)),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });
      await qc.cancelQueries({ queryKey: ["reposts"] });

      const previousFeed = qc.getQueryData(["feed"]);
      const previousBookmarks = qc.getQueryData(["bookmarks"]);
      const previousReposts = qc.getQueryData(["reposts"]);

      // Optimistic update feed
      qc.setQueryData(["feed"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: any) =>
              p.id === postId
                ? {
                    ...p,
                    isReposted: !isReposted,
                    repostCount: isReposted
                      ? p.repostCount - 1
                      : p.repostCount + 1,
                  }
                : p,
            ),
          })),
        };
      });

      // Optimistic update bookmarks
      qc.setQueryData(["bookmarks"], (old: any) => {
        if (!old) return old;
        return old.map((b: any) =>
          b.post.id === postId
            ? {
                ...b,
                post: {
                  ...b.post,
                  isReposted: !isReposted,
                  repostCount: isReposted
                    ? b.post.repostCount - 1
                    : b.post.repostCount + 1,
                },
              }
            : b,
        );
      });

      // Optimistic update reposts
      qc.setQueryData(["reposts"], (old: any) => {
        if (!old) return old;
        return old.map((b: any) =>
          b.post.id === postId
            ? {
                ...b,
                post: {
                  ...b.post,
                  isReposted: !isReposted,
                  repostCount: isReposted
                    ? b.post.repostCount - 1
                    : b.post.repostCount + 1,
                },
              }
            : b,
        );
      });

      return { previousFeed, previousBookmarks, previousReposts };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(["feed"], context.previousFeed);
      }
      if (context?.previousBookmarks) {
        qc.setQueryData(["bookmarks"], context.previousBookmarks);
      }
      if (context?.previousReposts) {
        qc.setQueryData(["reposts"], context.previousReposts);
      }
    },
  });
};
