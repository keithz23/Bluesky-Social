import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RepostService } from "../services/repost.service";
import { rollbackPostCaches, snapshotPostCaches, updatePostEverywhere } from "../utils/post-cache.util";

export const useRepost = (postId: string, isReposted: boolean) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () =>
      isReposted
        ? RepostService.unRepost(postId)
        : RepostService.repost(postId),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["userPosts"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });
      await qc.cancelQueries({ queryKey: ["reposts"] });

      const snapshot = snapshotPostCaches(qc);

      updatePostEverywhere(qc, postId, (post) => ({
        ...post,
        isReposted: !isReposted,
        repostCount: Math.max(0, post.repostCount + (!isReposted ? 1 : -1))
      }));

      return snapshot;
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot) rollbackPostCaches(qc, snapshot);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['post-detail'] })
    }
  });
};
