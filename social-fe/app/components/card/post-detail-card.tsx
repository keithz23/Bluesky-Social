"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Heart, MoreHorizontal } from "lucide-react";
import { Feed } from "@/app/interfaces/feed.interface";
import { PostMedia } from "@/app/interfaces/post.interface";
import AvatarHoverCard from "./avatar-hover-card";
import ReplyPostModal from "../dialog/reply-post-dialog";
import PostDropDown from "../dropdown/post-dropdown";
import { dropdownItems } from "@/app/constants/dropdown.constant";
import { PostContent } from "../post-content";
import { useAuth } from "@/app/hooks/use-auth";
import { checkCanReply } from "@/app/utils/check.util";
import { useLike } from "@/app/hooks/use-like";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
import { formatCompactDate, formatCount } from "@/app/utils/format.util";
import { VerifiedBadge } from "../verified-badge";

interface PostDetailCardProps {
  post: Feed;
  role?: "parent" | "main" | "reply";
  disabled?: boolean;
}

export default function PostDetailCard({
  post,
  role,
  disabled,
}: PostDetailCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const requireAuth = useRequireAuthAction();
  const [zoomData, setZoomData] = useState<{
    media: PostMedia[];
    currentIndex: number;
  } | null>(null);

  const replyDisabled = disabled || (!!user && !checkCanReply(post, user));
  const { mutate: toggleLike } = useLike(post.id, post.isLiked);

  const handlePostClick = () => {
    if (role === "parent") {
      router.push(`/profile/${post.user.username}/post/${post.id}`);
    }
  };

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${post.user.username}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth()) return;
    toggleLike();
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!zoomData) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomData, handleNextImage, handlePrevImage]);

  const formattedDate = formatCompactDate(post.createdAt);

  const likeLabel = formatCount(post.likeCount, "like");
  const repostLabel = formatCount(post.repostCount, "repost");
  const saveLabel = formatCount(post.bookmarkCount, "save");
  const isMain = role === "main";

  return (
    <>
      <div
        className={`transition hover:bg-gray-50/40 ${
          isMain ? "border-b border-gray-100 px-4 py-3" : "px-4 py-2.5"
        }`}
        onClick={handlePostClick}
      >
        <div className="group/post flex cursor-pointer gap-3">
          <div className="relative flex shrink-0 flex-col items-center">
            <div className="z-10" onClick={(e) => e.stopPropagation()}>
              <AvatarHoverCard
                data={post}
                handleProfileClick={handleProfileClick}
              />
            </div>
            {role === "parent" && (
              <div className="absolute top-10 bottom-[-18px] w-px bg-gray-200" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-1">
                  <button
                    type="button"
                    className="max-w-[45%] truncate text-left text-[14px] font-bold text-gray-900 hover:underline"
                    onClick={handleProfileClick}
                  >
                    {post.user.displayName || post.user.username}
                  </button>
                  {post.user.verified && <VerifiedBadge />}
                  <PostContent
                    content={post.content}
                    className={`min-w-0 flex-1 leading-snug text-gray-900 wrap-break-words ${
                      isMain ? "text-[15px]" : "text-[14px]"
                    }`}
                  />
                </div>

                {post.media?.length > 0 && (
                  <Carousel opts={{ align: "start" }} className="mt-2 w-full">
                    <CarouselContent onClick={(e) => e.stopPropagation()}>
                      {post.media.map((m: PostMedia, i: number) => (
                        <CarouselItem
                          key={m.id}
                          className={
                            post.media.length === 1
                              ? "basis-full"
                              : "basis-[82%] sm:basis-[70%]"
                          }
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomData({
                                media: post.media,
                                currentIndex: i,
                              });
                            }}
                            className={`w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-100 ${
                              post.media.length === 1
                                ? "max-h-96 min-h-40"
                                : "h-52"
                            }`}
                          >
                            <img
                              src={m.mediaUrl}
                              alt={m.altText ?? ""}
                              loading="lazy"
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
                  {repostLabel && <span>{repostLabel}</span>}
                  {likeLabel && <span>{likeLabel}</span>}
                  {saveLabel && <span>{saveLabel}</span>}
                  <ReplyPostModal
                    post={post}
                    type="text"
                    disabled={replyDisabled}
                  />
                </div>
              </div>

              <div
                className="flex shrink-0 items-start gap-1 text-gray-500"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleLike}
                  className="rounded-full p-1.5 transition-colors hover:bg-pink-50"
                  aria-label={post.isLiked ? "Unlike post" : "Like post"}
                >
                  <Heart
                    size={16}
                    strokeWidth={2}
                    className={`transition-colors ${
                      post.isLiked
                        ? "fill-pink-500 text-pink-500"
                        : "hover:text-pink-500"
                    }`}
                  />
                </button>
                <div className="pointer-events-none opacity-0 transition-opacity group-hover/post:pointer-events-auto group-hover/post:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
                  <PostDropDown
                    post={post}
                    items={dropdownItems}
                    triggerIcon={<MoreHorizontal size={16} />}
                    triggerClassName="p-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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
