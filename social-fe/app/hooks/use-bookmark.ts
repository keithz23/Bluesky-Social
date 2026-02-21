import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { axiosInstance } from "@/lib/axios";

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
      await qc.cancelQueries({ queryKey: ["bookmarks"] });

      const previousFeed = qc.getQueryData(["feed"]);
      const previousBookmarks = qc.getQueryData(["bookmarks"]);

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
                    isBookmarked: !isBookmarked,
                    bookmarkCount: isBookmarked
                      ? p.bookmarkCount - 1
                      : p.bookmarkCount + 1,
                  }
                : p,
            ),
          })),
        };
      });

      qc.setQueryData(["bookmarks"], (old: any) => {
        if (!old) return old;
        return isBookmarked
          ? old.filter((b: any) => b.post.id !== postId)
          : old;
      });

      return { previousFeed, previousBookmarks };
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },

    onError: (_err, _vars, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(["feed"], context.previousFeed);
      }
      if (context?.previousBookmarks) {
        qc.setQueryData(["bookmarks"], context.previousBookmarks);
      }
    },
  });
};
