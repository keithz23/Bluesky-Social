import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  CreatePostPayload,
  UpdatePostPayload,
} from "../interfaces/post.interface";
import { PostService } from "../services/post.service";
import { toast } from "sonner";
import { infiniteQueryOptions } from "./infinite-query-options";
import {
  extractCreatedPost,
  prependPostToFeedCache,
  prependPostToUserPostCaches,
  rollbackPostCaches,
  snapshotPostCaches,
  updatePostEverywhere,
} from "../utils/post-cache.util";
import { extractErrMsg } from "../utils/error.util";

export function usePost() {
  const qc = useQueryClient();
  const [createUploadProgress, setCreateUploadProgress] = useState<
    number | null
  >(null);
  const [updateUploadProgress, setUpdateUploadProgress] = useState<
    number | null
  >(null);

  const createPostMutation = useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const hasUpload = Boolean(payload.images?.length);
      const formData = new FormData();
      if (payload.content) formData.append("content", payload.content);
      if (payload.replyPrivacy) {
        formData.append("replyPrivacy", JSON.stringify(payload.replyPrivacy));
      }
      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((image) => formData.append("images", image));
      }
      if (payload.gifUrl) formData.append("gifUrl", payload.gifUrl);

      setCreateUploadProgress(hasUpload ? 0 : null);
      const response = await PostService.createPost(formData as any, (event) => {
        if (!event.total) return;
        setCreateUploadProgress(
          Math.min(99, Math.round((event.loaded / event.total) * 100)),
        );
      });
      setCreateUploadProgress(hasUpload ? 100 : null);
      return response.data;
    },

    onSuccess: (data) => {
      const createdPost = extractCreatedPost(data);
      if (createdPost) {
        prependPostToFeedCache(qc, createdPost);
        prependPostToUserPostCaches(qc, createdPost);
      }

      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
      toast.success("Post created successfully");
    },

    onError: (error) => {
      console.error("Create post failed:", error);
      toast.error(extractErrMsg(error));
    },
    onSettled: () => {
      setCreateUploadProgress(null);
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

  const updatePostMutation = useMutation({
    mutationFn: async (payload: UpdatePostPayload) => {
      const hasUpload = Boolean(payload.images?.length);
      const formData = new FormData();

      if (payload.content !== undefined) formData.append("content", payload.content);
      if (payload.replyPrivacy) {
        formData.append("replyPrivacy", JSON.stringify(payload.replyPrivacy));
      }
      if (payload.keepMediaIds) {
        formData.append("keepMediaIds", JSON.stringify(payload.keepMediaIds));
      }
      if (payload.images && payload.images.length > 0) {
        payload.images.forEach((image) => formData.append("images", image));
      }
      if (payload.gifUrl) formData.append("gifUrl", payload.gifUrl);

      setUpdateUploadProgress(hasUpload ? 0 : null);
      const response = await PostService.updatePost(
        payload.id,
        formData,
        (event) => {
          if (!event.total) return;
          setUpdateUploadProgress(
            Math.min(99, Math.round((event.loaded / event.total) * 100)),
          );
        },
      );
      setUpdateUploadProgress(hasUpload ? 100 : null);
      return response.data;
    },

    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["feed"] });
      await qc.cancelQueries({ queryKey: ["userPosts"] });
      await qc.cancelQueries({ queryKey: ["post-detail"] });
      await qc.cancelQueries({ queryKey: ["bookmarks"] });

      return snapshotPostCaches(qc);
    },

    onSuccess: (data) => {
      const updatedPost = extractCreatedPost(data);
      if (updatedPost) {
        updatePostEverywhere(qc, updatedPost.id, (post) => ({
          ...post,
          ...updatedPost,
          user: {
            ...post.user,
            ...updatedPost.user,
          },
        }));
      }

      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });
      qc.invalidateQueries({ queryKey: ["post-detail"] });
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Post updated successfully");
    },

    onError: (error, _payload, snapshot) => {
      if (snapshot) rollbackPostCaches(qc, snapshot);
      console.error("Update post failed:", error);
      toast.error(extractErrMsg(error));
    },
    onSettled: () => {
      setUpdateUploadProgress(null);
    },
  });

  return {
    createPost: createPostMutation,
    createUploadProgress,
    updatePost: updatePostMutation,
    updateUploadProgress,
    deletePost: deletePostMutation,
    isCreatingPost: createPostMutation.isPending,
    isUpdatingPost: updatePostMutation.isPending,
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
    enabled: !!username,
    ...infiniteQueryOptions,
  });
};

export const useGetPostById = (postId: string, enabled = true) => {
  return useQuery({
    queryKey: ["post-detail", postId],
    queryFn: () => PostService.getPostById(postId),
    enabled: enabled && !!postId,
  });
};

export const useSearchPosts = (query: string) => {
  const trimmedQuery = query.trim();

  return useInfiniteQuery({
    queryKey: ["posts", "search", trimmedQuery],
    queryFn: ({ pageParam }) =>
      PostService.searchPosts(trimmedQuery, pageParam, 20),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: trimmedQuery.length > 0,
    ...infiniteQueryOptions,
  });
};
