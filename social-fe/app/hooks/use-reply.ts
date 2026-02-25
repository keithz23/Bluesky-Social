import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { CreateReplyDto } from "../interfaces/post.interface";
import { ReplyService } from "../services/reply.service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useCreateReply = (postId: string) => {
  const router = useRouter();
  const qc = useQueryClient();

  const createReplyMutation = useMutation({
    mutationFn: async (payload: CreateReplyDto) => {
      const formData = new FormData();
      if (payload.content) formData.append("content", payload.content);
      if (payload.images?.length) {
        payload.images.forEach((img) => formData.append("images", img));
      }

      return await ReplyService.createReply(postId, formData as CreateReplyDto);
    },

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["replies", postId] });
      qc.invalidateQueries({ queryKey: ["postDetail", postId] });

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
      toast.error("Failed to send reply. Please try again.");
    },
  });

  return {
    createReply: createReplyMutation,
    isCreatingReply: createReplyMutation.isPending,
  };
};

export const useReplies = (postId: string) => {
  return useInfiniteQuery({
    queryKey: ["replies", postId],
    queryFn: ({ pageParam }) => ReplyService.getReplies(postId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: !!postId,
  });
};
