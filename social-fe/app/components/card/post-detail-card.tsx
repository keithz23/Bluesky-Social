"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Repeat,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Feed } from "@/app/interfaces/feed.interface";
import { PostMedia } from "@/app/interfaces/post.interface";
import AvatarHoverCard from "./avatar-hover-card";
import UserHoverCard from "./user-hover-card";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import ReplyPostModal from "../dialog/reply-post-dialog";

interface PostDetailCardProps {
  post: Feed;
}

export default function PostDetailCard({ post }: PostDetailCardProps) {
  const router = useRouter();
  const [zoomData, setZoomData] = useState<{
    media: PostMedia[];
    currentIndex: number;
  } | null>(null);

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${post.user.username}`);
  };

  const handleNextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (zoomData && zoomData.currentIndex < zoomData.media.length - 1) {
        setZoomData((prev) =>
          prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null,
        );
      }
    },
    [zoomData],
  );

  const handlePrevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (zoomData && zoomData.currentIndex > 0) {
        setZoomData((prev) =>
          prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null,
        );
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

  const formattedDate = useMemo(() => {
    if (!post.createdAt) return "";
    const distance = formatDistanceToNow(new Date(post.createdAt), {
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
  }, [post.createdAt]);

  const fullDate = useMemo(() => {
    if (!post.createdAt) return "";
    return new Date(post.createdAt).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [post.createdAt]);

  return (
    <>
      <div className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50/30 transition cursor-pointer">
        <div className="flex gap-3">
          {/* Avatar Section */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <AvatarHoverCard
              data={post}
              handleProfileClick={handleProfileClick}
            />
          </div>

          {/* Main Content Section */}
          <div className="flex-1 min-w-0">
            {/* Header: Name, Handle, Time, More */}
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1 overflow-hidden">
                <div
                  className="font-bold text-[15px] hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <UserHoverCard
                    data={post}
                    handleProfileClick={handleProfileClick}
                  />
                </div>
                <span className="text-gray-500 text-[15px] truncate">
                  @{post.user.username}
                </span>
                <span className="text-gray-500 text-[15px]">·</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="text-gray-500 text-[15px] hover:underline"
                      suppressHydrationWarning
                    >
                      {formattedDate}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p suppressHydrationWarning>{fullDate}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className="p-1.5 hover:bg-blue-50 rounded-full transition-colors group"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal
                  size={18}
                  className="text-gray-500 group-hover:text-blue-500"
                />
              </div>
            </div>

            {/* Post Text */}
            <p className="text-[15px] leading-snug text-gray-900 wrap-break-words mb-3">
              {post.content}
            </p>

            {/* Media Carousel */}
            {post.media?.length > 0 && (
              <Carousel opts={{ align: "start" }} className="w-full mb-3">
                <CarouselContent>
                  {post.media.map((m: PostMedia, i: number) => (
                    <CarouselItem
                      key={m.id}
                      className={
                        post.media.length === 1 ? "basis-full" : "basis-[85%]"
                      }
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomData({ media: post.media, currentIndex: i });
                        }}
                        className={`w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-100 ${post.media.length === 1 ? "aspect-video" : "h-64"}`}
                      >
                        <img
                          src={m.mediaUrl}
                          alt={m.altText ?? ""}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}

            <div className="flex items-center gap-4 py-3 border-y border-gray-100 text-[14px]">
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">
                  {post.repostCount}
                </span>
                <span className="text-gray-500">reposts</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">0</span>
                <span className="text-gray-500">quotes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">
                  {post.likeCount}
                </span>
                <span className="text-gray-500">likes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">
                  {post.bookmarkCount}
                </span>
                <span className="text-gray-500">saves</span>
              </div>
            </div>

            {/* Reaction Icons */}
            <div
              className="flex items-center justify-between mt-2 px-1 text-gray-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-10">
                {/* Reply */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <ReplyPostModal post={post} />
                  <span className="text-[13px] group-hover:text-blue-500">
                    {post.replyCount}
                  </span>
                </div>
                {/* Repost */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <div
                    className={`p-2 rounded-full group-hover:bg-green-50 transition-colors ${post.isReposted ? "text-green-600" : ""}`}
                  >
                    <Repeat size={19} className="group-hover:text-green-500" />
                  </div>
                  <span
                    className={`text-[13px] group-hover:text-green-500 ${post.isReposted ? "text-green-600" : ""}`}
                  >
                    {post.repostCount}
                  </span>
                </div>
                {/* Like */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <div
                    className={`p-2 rounded-full group-hover:bg-pink-50 transition-colors ${post.isLiked ? "text-pink-600" : ""}`}
                  >
                    <Heart
                      size={19}
                      className={`group-hover:text-pink-500 ${post.isLiked ? "fill-pink-600 text-pink-600" : ""}`}
                    />
                  </div>
                  <span
                    className={`text-[13px] group-hover:text-pink-500 ${post.isLiked ? "text-pink-600" : ""}`}
                  >
                    {post.likeCount}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div className="p-2 rounded-full hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Bookmark
                    size={19}
                    className={`group-hover:text-blue-500 ${post.isBookmarked ? "fill-blue-500 text-blue-500" : ""}`}
                  />
                </div>
                <div className="p-2 rounded-full hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Share size={19} className="group-hover:text-blue-500" />
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
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden">
          <DialogTitle className="sr-only">Zoom Image</DialogTitle>
          {zoomData && (
            <div className="relative w-full h-full flex items-center justify-center">
              {zoomData.currentIndex > 0 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all"
                >
                  <ChevronLeft size={28} />
                </button>
              )}
              <img
                src={zoomData.media[zoomData.currentIndex].mediaUrl}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
              {zoomData.currentIndex < zoomData.media.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
