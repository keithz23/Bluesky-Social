import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { CreateReplyDto } from "../interfaces/post.interface";
import { ReplyService } from "../services/reply.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { infiniteQueryOptions } from "./infinite-query-options";
import { Feed } from "../interfaces/feed.interface";
import { updatePostEverywhere } from "../utils/post-cache.util";
import { extractErrMsg } from "../utils/error.util";

type InfiniteRepliesData = {
  pages: Array<{
    replies?: Feed[];
    [key: string]: unknown;
  }>;
  pageParams?: unknown[];
};

const appendReplyToThread = (old: unknown, reply: Feed) => {
  const data = old as InfiniteRepliesData | undefined;
  if (!data?.pages?.length) return old;
  if (
    data.pages.some((page) =>
      page.replies?.some((item) => item.id === reply.id),
    )
  ) {
    return old;
  }

  const pageIndex = data.pages.length - 1;

  return {
    ...data,
    pages: data.pages.map((page, index) =>
      index === pageIndex
        ? {
            ...page,
            replies: [...(page.replies ?? []), reply],
          }
        : page,
    ),
  };
};

export const useCreateReply = (postId: string) => {
  const router = useRouter();
  const qc = useQueryClient();
  const [createReplyUploadProgress, setCreateReplyUploadProgress] = useState<
    number | null
  >(null);

  const createReplyMutation = useMutation({
    mutationFn: async (payload: CreateReplyDto) => {
      const hasUpload = Boolean(payload.images?.length);
      const formData = new FormData();
      if (payload.content) formData.append("content", payload.content);
      if (payload.images?.length) {
        payload.images.forEach((img) => formData.append("images", img));
      }
      if (payload.gifUrl) formData.append("gifUrl", payload.gifUrl);

      setCreateReplyUploadProgress(hasUpload ? 0 : null);
      const response = await ReplyService.createReply(
        postId,
        formData,
        (event) => {
          if (!event.total) return;
          setCreateReplyUploadProgress(
            Math.min(99, Math.round((event.loaded / event.total) * 100)),
          );
        },
      );
      setCreateReplyUploadProgress(hasUpload ? 100 : null);
      return response;
    },

    onSuccess: (data) => {
      qc.setQueryData(["replies", postId], (old: unknown) =>
        appendReplyToThread(old, data),
      );
      updatePostEverywhere(qc, postId, (post) => ({
        ...post,
        replyCount: post.replyCount + 1,
      }));

      qc.invalidateQueries({ queryKey: ["post-detail", postId] });
      qc.invalidateQueries({ queryKey: ["replies", postId] });
      qc.invalidateQueries({ queryKey: ["userPosts"] });

      toast.success("Your reply was sent", {
        action: {
          label: "View",
          onClick: () => {
            router.push(`/profile/${data.user.username}/post/${data.id}`);
          },
        },
      });
    },
    onError: (error) => {
      console.error("Create reply failed:", error);
      toast.error(extractErrMsg(error));
    },
    onSettled: () => {
      setCreateReplyUploadProgress(null);
    },
  });

  return {
    createReply: createReplyMutation,
    createReplyUploadProgress,
    isCreatingReply: createReplyMutation.isPending,
  };
};

export const useReplies = (postId: string, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ["replies", postId],
    queryFn: ({ pageParam }) => ReplyService.getReplies(postId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: enabled && !!postId,
    ...infiniteQueryOptions,
  });
};
