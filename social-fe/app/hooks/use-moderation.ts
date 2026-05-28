import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ModerationService,
  ReportReason,
} from "@/app/services/moderation.service";
import { extractErrMsg } from "../utils/error.util";

export const useModeration = () => {
  const qc = useQueryClient();

  const refreshSocialCaches = () => {
    qc.invalidateQueries({ queryKey: ["feed"] });
    qc.invalidateQueries({ queryKey: ["userPosts"] });
    qc.invalidateQueries({ queryKey: ["suggestions"] });
  };

  const blockUser = useMutation({
    mutationFn: ModerationService.blockUser,
    onSuccess: () => {
      toast.success("Account blocked");
      refreshSocialCaches();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const muteUser = useMutation({
    mutationFn: ModerationService.muteUser,
    onSuccess: () => {
      toast.success("Account muted");
      refreshSocialCaches();
    },
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  const reportPost = useMutation({
    mutationFn: (payload: {
      postId: string;
      reason: ReportReason;
      details?: string;
    }) => ModerationService.reportPost(payload),
    onSuccess: () => toast.success("Report submitted"),
    onError: (error) => toast.error(extractErrMsg(error)),
  });

  return {
    blockUser,
    muteUser,
    reportPost,
    isModerating:
      blockUser.isPending || muteUser.isPending || reportPost.isPending,
  };
};
