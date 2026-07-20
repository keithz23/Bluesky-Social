import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkService } from "../services/bookmark.service";
import { rollbackPostCaches, snapshotPostCaches, updatePostEverywhere } from "../utils/post-cache.util";

export const useGetBookmarks = () => {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: BookmarkService.getBookMarks,
  });
};

export const useBookmark = (postId: string, isBookmarked: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isBookmarked
        ? BookmarkService.unBookMark(postId)
        : BookmarkService.bookmark(postId),

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
