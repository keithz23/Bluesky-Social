import { useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { axiosInstance } from "@/lib/axios";

export const useLike = (postId: string, isLiked: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isLiked
        ? axiosInstance.delete(API_ENDPOINT.LIKES.UNLIKE(postId))
        : axiosInstance.post(API_ENDPOINT.LIKES.LIKE(postId)),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });
      await qc.cancelQueries({ queryKey: ["reposts"] });

      const previousFeed = qc.getQueryData(["feed"]);
      const previousBookmarks = qc.getQueryData(["bookmarks"]);
      const previousReposts = qc.getQueryData(["reposts"]);

      // Optimistic update feed
      qc.setQueryData(["feed"], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          posts: page.posts.map((p: any) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: !isLiked,
                  likeCount: isLiked ? p.likeCount - 1 : p.likeCount + 1,
                }
              : p,
          ),
        })),
      }));

      // Optimistic update bookmarks
      qc.setQueryData(["bookmarks"], (old: any) => {
        if (!old) return old;
        return old.map((b: any) =>
          b.post.id === postId
            ? {
                ...b,
                post: {
                  ...b.post,
                  isLiked: !isLiked,
                  likeCount: isLiked
                    ? b.post.likeCount - 1
                    : b.post.likeCount + 1,
                },
              }
            : b,
        );
      });

      qc.setQueryData(["reposts"], (old: any) => {
        if (!old) return old;
        return old.map((b: any) =>
          b.post.id === postId
            ? {
                ...b,
                post: {
                  ...b.post,
                  isLiked: !isLiked,
                  likeCount: isLiked
                    ? b.post.likeCount - 1
                    : b.post.likeCount + 1,
                },
              }
            : b,
        );
      });

      return { previousFeed, previousBookmarks, previousReposts };
    },

    // Rollback
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
