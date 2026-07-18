import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import {
  rollbackPostCaches,
  snapshotPostCaches,
  updatePostEverywhere,
} from "../utils/post-cache.util";

export const usePinPost = (
  postId: string,
  isPinned: boolean,
  username?: string,
) => {
  const qc = useQueryClient();
  const nextPinned = !isPinned;

  return useMutation({
    mutationFn: () =>
      isPinned
        ? axiosInstance.delete(API_ENDPOINT.POSTS.UNPIN_POST(postId))
        : axiosInstance.post(API_ENDPOINT.POSTS.PIN_POST(postId)),

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["userPosts"] });
      await qc.cancelQueries({ queryKey: ["userPinnedPosts"] });

      const snapshot = snapshotPostCaches(qc);

      updatePostEverywhere(qc, postId, (post) => ({
        ...post,
        isPinned: nextPinned,
      }));

      return snapshot;
    },

    onError: (_err, _vars, snapshot) => {
      if (snapshot) rollbackPostCaches(qc, snapshot);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["post-detail"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
      qc.invalidateQueries({ queryKey: ["userPinnedPosts"] });
      if (username) {
        qc.invalidateQueries({ queryKey: ["userPinnedPosts", username] });
      }
    },
  });
};
