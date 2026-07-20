import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LikeService } from "../services/like.service";
import { rollbackPostCaches, snapshotPostCaches, updatePostEverywhere } from "../utils/post-cache.util";

export const useLike = (postId: string, isLiked: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isLiked
        ? LikeService.unLike(postId)
        : LikeService.like(postId),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["userPosts"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });

      const snapshot = snapshotPostCaches(qc);

      updatePostEverywhere(qc, postId, (post) => ({
        ...post,
        isLiked: !isLiked,
        likeCount: Math.max(0, post.likeCount + (!isLiked ? 1 : -1))
      }))

      return snapshot
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot) rollbackPostCaches(qc, snapshot);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["post-detail"] });
    },
  });
};
