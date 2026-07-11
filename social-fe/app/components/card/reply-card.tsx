"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { Feed } from "@/app/interfaces/feed.interface";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import Avatar from "../avatar";
import { PostMedia } from "@/app/interfaces/post.interface";
import ReplyPostModal from "../dialog/reply-post-dialog";
import { PostContent } from "../post-content";
import { useAuth } from "@/app/hooks/use-auth";
import { checkCanReply } from "@/app/utils/check.util";
import { useReplies } from "@/app/hooks/use-reply";
import { useLike } from "@/app/hooks/use-like";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";

interface ReplyCardProps {
  reply: Feed;
  isLastInThread?: boolean;
  disabled?: boolean;
  depth?: 0 | 1;
  parentReply?: Feed;
}

const formatCount = (count: number, label: string) => {
  if (count <= 0) return null;
  return `${count.toLocaleString()} ${label}${count === 1 ? "" : "s"}`;
};

const VerifiedBadge = () => (
  <svg
    viewBox="0 0 24 24"
    aria-label="Verified account"
    className="size-3.5 shrink-0 text-[#0066FF]"
    fill="currentColor"
  >
    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.74 2.043 3.39-.11.457-.167.936-.167 1.41 0 2.21 1.71 4 3.918 4 .537 0 1.058-.11 1.536-.31.587 1.25 1.854 2.11 3.337 2.11 1.48 0 2.75-.86 3.336-2.11.478.2.998.31 1.536.31 2.21 0 3.918-1.79 3.918-4 0-.474-.057-.953-.167-1.41 1.216-.65 2.043-1.93 2.043-3.39zM10.25 16.5l-3.5-3.5 1.41-1.41L10.25 13.67l7.09-7.09 1.41 1.41L10.25 16.5z" />
  </svg>
);

export default function ReplyCard({
  reply,
  isLastInThread = false,
  disabled = false,
  depth = 0,
  parentReply,
}: ReplyCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const requireAuth = useRequireAuthAction();
  const [showReplies, setShowReplies] = useState(false);
  const [zoomData, setZoomData] = useState<{
    media: PostMedia[];
    currentIndex: number;
  } | null>(null);

  const isNested = depth === 1;
  const replyTarget = parentReply ?? reply;
  const replyDisabled =
    disabled || (!!user && !checkCanReply(replyTarget, user));
  const { mutate: toggleLike } = useLike(reply.id, reply.isLiked);

  const {
    data: nestedData,
    isLoading: isLoadingNestedReplies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies(reply.id, showReplies && !isNested && reply.replyCount > 0);

  const nestedReplies = useMemo(
    () => nestedData?.pages.flatMap((page) => page.replies ?? []) ?? [],
    [nestedData],
  );

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${reply.user.username}`);
  };

  const handleNextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (zoomData && zoomData.currentIndex < zoomData.media.length - 1) {
        setZoomData({ ...zoomData, currentIndex: zoomData.currentIndex + 1 });
      }
    },
    [zoomData],
  );

  const handlePrevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (zoomData && zoomData.currentIndex > 0) {
        setZoomData({ ...zoomData, currentIndex: zoomData.currentIndex - 1 });
      }
    },
    [zoomData],
  );

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth()) return;
    toggleLike();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!zoomData) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomData, handleNextImage, handlePrevImage]);

  const formattedDate = useMemo(() => {
    if (!reply.createdAt) return "";
    const distance = formatDistanceToNow(new Date(reply.createdAt), {
      addSuffix: false,
      locale: enUS,
    });
    return distance
      .replace(/^about\s|almost\s|over\s/g, "")
      .replace("less than a minute", "now")
      .replace(/\s?minutes?/, "m")
      .replace(/\s?hours?/, "h")
      .replace(/\s?days?/, "d")
      .replace(/\s?months?/, "mo")
      .replace(/\s?years?/, "y");
  }, [reply.createdAt]);

  const likeLabel = formatCount(reply.likeCount, "like");
  const replyPrefix = `@${reply.user.username} `;

  return (
    <>
      <div
        className={`transition hover:bg-gray-50/40 ${
          isNested ? "px-0 py-1.5" : "px-4 py-2.5"
        } ${!isLastInThread && !isNested ? "border-b border-gray-100/70" : ""}`}
      >
        <div className="group/comment flex gap-3">
          <Avatar
            data={reply.user}
            onClick={handleProfileClick}
            className={
              isNested ? "size-8 text-sm sm:size-8" : "size-9 text-base sm:size-10"
            }
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-1">
                  <button
                    type="button"
                    className="max-w-[45%] truncate text-left text-[14px] font-bold text-gray-900 hover:underline"
                    onClick={handleProfileClick}
                  >
                    {reply.user.displayName || reply.user.username}
                  </button>
                  {reply.user.verified && <VerifiedBadge />}
                  <PostContent
                    content={reply.content}
                    className="min-w-0 flex-1 text-[14px] leading-snug text-gray-900 wrap-break-words"
                  />
                </div>

                {reply?.media?.length > 0 && (
                  <Carousel opts={{ align: "start" }} className="mt-2 w-full">
                    <CarouselContent>
                      {reply.media.map((m: PostMedia, i: number) => (
                        <CarouselItem
                          key={m.id}
                          className={
                            reply.media.length === 1
                              ? "basis-full"
                              : "basis-[82%] sm:basis-[70%]"
                          }
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomData({
                                media: reply.media,
                                currentIndex: i,
                              });
                            }}
                            className={`w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-100 ${
                              reply.media.length === 1
                                ? "max-h-80 min-h-36"
                                : "h-48"
                            }`}
                          >
                            <img
                              src={m.mediaUrl}
                              alt={m.altText ?? ""}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                )}

                <div
                  className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-gray-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-normal" suppressHydrationWarning>
                    {formattedDate}
                  </span>
                  {likeLabel && <span>{likeLabel}</span>}
                  <ReplyPostModal
                    post={replyTarget}
                    type="text"
                    disabled={replyDisabled}
                    initialText={replyPrefix}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleLike}
                className="shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-pink-50"
                aria-label={reply.isLiked ? "Unlike reply" : "Like reply"}
              >
                <Heart
                  size={16}
                  strokeWidth={2}
                  className={`transition-colors ${
                    reply.isLiked
                      ? "fill-pink-500 text-pink-500"
                      : "hover:text-pink-500"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {!isNested && reply.replyCount > 0 && (
          <div className="ml-12 mt-1.5 sm:ml-[52px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReplies((current) => !current);
              }}
              className="flex items-center gap-3 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-900"
            >
              <span className="h-px w-6 bg-gray-300" />
              {showReplies ? "Hide replies" : `View replies (${reply.replyCount})`}
            </button>

            {showReplies && (
              <div className="mt-1.5">
                {isLoadingNestedReplies && (
                  <div className="pl-2 text-[12px] text-gray-400">
                    Loading replies...
                  </div>
                )}

                {nestedReplies.map((nestedReply, index) => (
                  <ReplyCard
                    key={nestedReply.id}
                    reply={nestedReply}
                    depth={1}
                    parentReply={reply}
                    disabled={disabled}
                    isLastInThread={index === nestedReplies.length - 1}
                  />
                ))}

                {hasNextPage && (
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchNextPage();
                    }}
                    className="ml-2 mt-1 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingNextPage ? "Loading..." : "View more replies"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={!!zoomData}
        onOpenChange={(open) => !open && setZoomData(null)}
      >
        <DialogContent className="flex h-[90vh] w-[95vw] max-w-7xl items-center justify-center overflow-hidden border-none bg-black/95 p-0">
          <DialogTitle className="sr-only">Zoom Image</DialogTitle>

          {zoomData && (
            <div className="group relative flex h-full w-full items-center justify-center">
              {zoomData.currentIndex > 0 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 z-50 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <img
                src={zoomData.media[zoomData.currentIndex].mediaUrl}
                alt={
                  zoomData.media[zoomData.currentIndex].altText ??
                  "Zoomed image"
                }
                className="max-h-full max-w-full object-contain"
              />

              {zoomData.currentIndex < zoomData.media.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 z-50 rounded-full bg-black/50 p-3 text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <ChevronRight size={28} />
                </button>
              )}

              {zoomData.media.length > 1 && (
                <div className="absolute left-4 top-4 z-50 rounded-full bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
                  {zoomData.currentIndex + 1} / {zoomData.media.length}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
