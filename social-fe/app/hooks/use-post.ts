import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreatePostPayload } from "../interfaces/post.interface";
import { PostService } from "../services/post.service";

export function usePost() {
  const qc = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const formData = new FormData();

      if (payload.content) {
        formData.append("content", payload.content);
      }

      if (payload.replyPrivacy) {
        formData.append(
          "replyPrivacy",
          JSON.stringify(payload.replyPrivacy),
        );
      }

      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((image) => {
          formData.append("images", image);
        });
      }

      if (payload.gifUrl) {
        formData.append("gifUrl", payload.gifUrl);
      }

      const response = await PostService.createPost(formData as any);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      console.error("Create post failed:", error);
    },
  });

  return {
    createPost: createPostMutation,
    isCreatingPost: createPostMutation.isPending,
  };
}
