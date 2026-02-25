"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Share, ChevronLeft, ChevronRight } from "lucide-react";
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
import LikeButton from "../button/like-button";
import BookMarkButton from "../button/bookmark-button";
import RepostButton from "../button/repost-button";
import PostDropDown from "../dropdown/post-dropdown";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { FollowButton } from "../button/follow-button";

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
      .replace(/^about\s/, "")
      .replace(/^almost\s/, "")
      .replace(/^over\s/, "")
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
      <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer">
        <div className="flex gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <AvatarHoverCard
              data={post}
              handleProfileClick={handleProfileClick}
            />
          </div>

          {/* Post Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-x-1">
              <div className="flex item-center gap-x-1">
                <div
                  className="font-bold text-[15px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <UserHoverCard
                    data={post}
                    handleProfileClick={handleProfileClick}
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="text-gray-500 text-sm cursor-pointer"
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

              {post.user.followStatus && (
                <div onClick={(e) => e.stopPropagation()}>
                  <FollowButton targetUserId={post.user.id} />
                </div>
              )}
            </div>

            <p className="mt-1 text-[15px] leading-normal text-gray-900">
              {post.content}
            </p>

            {/* Media Carousel */}
            {post.media?.length > 0 && (
              <Carousel
                opts={{ align: "start" }}
                className="w-full max-w-full mt-3"
              >
                <CarouselContent>
                  {post.media.map((m: PostMedia, i: number) => {
                    const isSingleImage = post.media.length === 1;

                    return (
                      <CarouselItem
                        key={m.id}
                        className={
                          isSingleImage
                            ? "basis-full"
                            : "basis-4/5 sm:basis-1/2 lg:basis-1/3"
                        }
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomData({ media: post.media, currentIndex: i });
                          }}
                          className={`w-full rounded-xl overflow-hidden bg-gray-100 cursor-pointer group ${
                            isSingleImage
                              ? "h-64 sm:h-80 md:h-100 lg:h-125"
                              : "h-56 sm:h-64 md:h-72 lg:h-80"
                          }`}
                        >
                          <img
                            src={m.mediaUrl}
                            alt={m.altText ?? "Post image"}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            )}

            {/* Reaction Bar */}
            <div
              className="flex items-center justify-between mt-3 text-gray-500 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-1 group cursor-pointer">
                  <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                    <MessageSquare
                      size={18}
                      strokeWidth={2.2}
                      className="group-hover:text-blue-500 transition-colors"
                    />
                  </div>
                  <span className="group-hover:text-blue-500 transition-colors">
                    {post.replyCount}
                  </span>
                </div>

                <RepostButton
                  postId={post.id}
                  isReposted={post.isReposted}
                  repostCount={post.repostCount}
                />

                <LikeButton
                  postId={post.id}
                  isLiked={post.isLiked}
                  likeCount={post.likeCount}
                />
              </div>

              <div className="flex items-center gap-2">
                <BookMarkButton
                  postId={post.id}
                  isBookmarked={post.isBookmarked}
                  bookmarkCount={post.bookmarkCount}
                />
                <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                  <Share size={18} strokeWidth={2.2} />
                </div>
                <div className="p-2 rounded-full hover:bg-gray-100 cursor-pointer transition-colors">
                  <PostDropDown post={post} />
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
            <div className="relative w-full h-full flex items-center justify-center group">
              {/* Previous */}
              {zoomData.currentIndex > 0 && (
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 z-50 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all backdrop-blur-sm cursor-pointer"
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
                className="max-w-full max-h-full object-contain"
              />

              {/* Next */}
              {zoomData.currentIndex < zoomData.media.length - 1 && (
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 z-50 p-3 rounded-full bg-black/50 hover:bg-white/20 text-white transition-all backdrop-blur-sm cursor-pointer"
                >
                  <ChevronRight size={28} />
                </button>
              )}

              {/* Counter */}
              {zoomData.media.length > 1 && (
                <div className="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
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
