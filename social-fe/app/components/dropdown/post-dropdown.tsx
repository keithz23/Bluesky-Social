import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePost } from "@/app/hooks/use-post";
import { Feed } from "@/app/interfaces/feed.interface";
import { useAuth } from "@/app/hooks/use-auth";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";
import { Loader2, MoreHorizontal, Trash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useModeration } from "@/app/hooks/use-moderation";
import { ReportReason } from "@/app/services/moderation.service";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
import EditPostDialog from "../dialog/edit-post-dialog";
import { Pencil } from "lucide-react";

interface PostDropDownProps {
  post: Feed;
  items: DropdownItem[];
}

export default function PostDropDown({ post, items }: PostDropDownProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const { deletePost, isDeletingPost } = usePost();
  const { blockUser, muteUser, reportPost, isModerating } = useModeration();
  const { user } = useAuth();
  const requireAuth = useRequireAuthAction();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const pathname = usePathname();

  const isOwner = user?.id === post?.user?.id;

  const dropdownItems = isOwner
    ? [
      {
        id: 98,
        title: "Edit post",
        icon: <Pencil size={18} />,
        onClick: () => setIsEditOpen(true),
      },
      ...items,
      {
        id: 99,
        title: "Delete post",
        icon: <Trash size={18} />,
        onClick: () => setIsModalOpen(true),
        className: "text-red-600 focus:text-red-700 focus:bg-red-50",
      },
    ]
    : items;

  const confirmDelete = () => {
    if (!requireAuth()) return;

    const isOnPostDetail =
      pathname === `/profile/${post.user.username}/post/${post.id}`;

    deletePost.mutate(post.id, {
      onSettled: () => {
        setIsModalOpen(false);
      },
      onSuccess: () => {
        if (isOnPostDetail) {
          const parentPost = post.parentChain?.[post.parentChain.length - 1];
          const parentUsername =
            parentPost?.user?.username ?? post.rootPost?.user?.username;

          if (post.parentPostId && parentUsername) {
            // Reply → go back to parent post
            router.push(`/profile/${parentUsername}/post/${post.parentPostId}`);
          } else {
            router.push("/");
          }
        }
      },
    });
  };

  const hidePostFromCaches = () => {
    const removePost = (old: any): any => {
      if (!old || typeof old !== "object") return old;
      if (Array.isArray(old)) return old.filter((item) => item?.id !== post.id);
      return {
        ...old,
        ...(old.pages && {
          pages: old.pages.map((page: any) => removePost(page)),
        }),
        ...(old.posts && {
          posts: old.posts.filter((item: Feed) => item.id !== post.id),
        }),
        ...(old.replies && {
          replies: old.replies.filter((item: Feed) => item.id !== post.id),
        }),
      };
    };

    qc.setQueryData(["feed"], removePost);
    qc.getQueriesData({ queryKey: ["userPosts"] }).forEach(([queryKey]) => {
      qc.setQueryData(queryKey, removePost);
    });
    toast.success("Post hidden");
  };

  const copyPostText = async () => {
    await navigator.clipboard.writeText(post.content || "");
    toast.success("Post text copied");
  };

  const handleDropdownAction = (item: DropdownItem) => {
    if (item.onClick) {
      item.onClick();
      return;
    }

    switch (item.title) {
      case "Copy post text":
        copyPostText();
        break;
      case "Hide post for me":
        hidePostFromCaches();
        break;
      case "Mute account":
        if (!requireAuth()) return;
        if (isOwner) return toast.info("You cannot mute your own account");
        muteUser.mutate(post.user.id);
        break;
      case "Block account":
        if (!requireAuth()) return;
        if (isOwner) return toast.info("You cannot block your own account");
        blockUser.mutate(post.user.id);
        break;
      case "Report post":
        if (!requireAuth()) return;
        if (isOwner) return toast.info("You cannot report your own post");
        setIsReportOpen(true);
        break;
      case "Mute thread":
        hidePostFromCaches();
        break;
      case "Translate":
      case "Show more like this":
      case "Show less like this":
      case "Mute words & tags":
      case "Pin to your profile":
      case "Edit interaction settings":
        toast.info("This action is not available yet");
        break;
      default:
        break;
    }
  };

  const submitReport = () => {
    if (!requireAuth()) return;

    reportPost.mutate(
      {
        postId: post.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsReportOpen(false);
          setReportReason("SPAM");
          setReportDetails("");
        },
      },
    );
  };

  return (
    <div
      className="contents"
      onClick={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors">
          <MoreHorizontal size={18} strokeWidth={2.2} />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60 p-1 text-[#111827]" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuGroup>
            {dropdownItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <DropdownMenuItem
                  className={`flex cursor-pointer items-center justify-between py-2.5 font-medium ${item.className || ""}`}
                  onClick={() => handleDropdownAction(item)}
                >
                  <span>{item.title}</span>
                  <span className={item.className ? "" : "text-slate-600"}>
                    {item.icon}
                  </span>
                </DropdownMenuItem>

                {(index === 1 || index === 3 || index === 5 || index === 6) && (
                  <DropdownMenuSeparator className="my-1" />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu >

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!isDeletingPost) setIsModalOpen(open);
        }}
      >
        <DialogContent
          className="z-100 w-[calc(100vw-2rem)] max-w-90 gap-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl [&>button]:hidden"
          onInteractOutside={(event) => {
            if (isDeletingPost) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (isDeletingPost) event.preventDefault();
          }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <DialogTitle className="text-[17px] font-bold text-slate-950">
                Delete this post?
              </DialogTitle>
              <p className="mt-1.5 text-sm leading-5 text-slate-500">
                If you remove this post, you won't be able to recover it.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:grid sm:grid-cols-2">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeletingPost}
                className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeletingPost}
                className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#E42240] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c91d37]"
              >
                Delete
              </button>
            </div>

            <p className="text-center text-xs leading-4 text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <EditPostDialog
        post={post}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <Dialog
        open={isReportOpen}
        onOpenChange={(open) => {
          if (!isModerating) setIsReportOpen(open);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-90 rounded-3xl border-none bg-white p-6 shadow-xl"
          onInteractOutside={(event) => {
            if (isModerating) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (isModerating) event.preventDefault();
          }}
        >
          <DialogTitle className="text-xl font-bold text-gray-900">
            Report this post
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-snug text-gray-600">
            Choose the reason that best describes the problem.
          </DialogDescription>

          <div className="flex flex-col gap-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.value}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <span>{reason.label}</span>
                <input
                  type="radio"
                  name={`report-${post.id}`}
                  checked={reportReason === reason.value}
                  onChange={() => setReportReason(reason.value)}
                />
              </label>
            ))}
          </div>

          <textarea
            value={reportDetails}
            onChange={(event) => setReportDetails(event.target.value)}
            placeholder="Add details"
            className="min-h-22 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            maxLength={1000}
          />

          <div className="flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={submitReport}
              disabled={isModerating}
              className="flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isModerating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Submit report"
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              disabled={isModerating}
              className="flex w-full items-center justify-center rounded-full bg-[#F1F5F9] py-3.5 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#e2e8f0] disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const REPORT_REASONS: Array<{ label: string; value: ReportReason }> = [
  { label: "Spam", value: "SPAM" },
  { label: "Harassment", value: "HARASSMENT" },
  { label: "Hate speech", value: "HATE_SPEECH" },
  { label: "Violence", value: "VIOLENCE" },
  { label: "Nudity", value: "NUDITY" },
  { label: "False information", value: "FALSE_INFORMATION" },
  { label: "Impersonation", value: "IMPERSONATION" },
  { label: "Other", value: "OTHER" },
];
