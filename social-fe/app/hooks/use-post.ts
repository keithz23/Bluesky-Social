import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CreatePostPayload } from "../interfaces/post.interface";
import { PostService } from "../services/post.service";
import { toast } from "sonner";

export function usePost() {
  const qc = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const formData = new FormData();
      if (payload.content) formData.append("content", payload.content);
      if (payload.replyPrivacy) {
        formData.append("replyPrivacy", JSON.stringify(payload.replyPrivacy));
      }
      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((image) => formData.append("images", image));
      }
      if (payload.gifUrl) formData.append("gifUrl", payload.gifUrl);

      const response = await PostService.createPost(formData as any);
      return response.data;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success("Post created successfully");
    },

    onError: (error) => {
      console.error("Create post failed:", error);
      toast.error("Failed to create post");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await PostService.deletePost(postId);
      return response.data;
    },

    onMutate: async (postId: string) => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["userPosts"] });

      const previousFeed = qc.getQueryData(["feed"]);
      const userPostsCache = qc.getQueriesData({ queryKey: ["userPosts"] });

      qc.setQueryData(["feed"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((p: any) => p.id !== postId),
          })),
        };
      });

      userPostsCache.forEach(([queryKey]) => {
        qc.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              posts: page.posts.filter((p: any) => p.id !== postId),
            })),
          };
        });
      });

      return { previousFeed, userPostsCache };
    },

    onSuccess: () => {
      toast.success("Post deleted successfully");
    },

    onError: (error, _postId, context) => {
      if (context?.previousFeed) {
        qc.setQueryData(["feed"], context.previousFeed);
      }
      context?.userPostsCache?.forEach(([queryKey, data]) => {
        qc.setQueryData(queryKey, data);
      });
      console.error("Delete post failed:", error);
      toast.error("Failed to delete post");
    },
  });

  return {
    createPost: createPostMutation,
    deletePost: deletePostMutation,
    isCreatingPost: createPostMutation.isPending,
    isDeletingPost: deletePostMutation.isPending,
  };
}

export const useUserPosts = (username: string, filter: string) => {
  return useInfiniteQuery({
    queryKey: ["userPosts", username, filter],
    queryFn: ({ pageParam }) =>
      PostService.getPostsByUsername(username, filter, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
};
