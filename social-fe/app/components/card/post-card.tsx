"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useMemo } from "react";
import ReplyPostModal from "../dialog/reply-post-dialog";

interface PostCardProps {
  post: Feed;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();

  const [zoomData, setZoomData] = useState<{
    media: PostMedia[];
    currentIndex: number;
  } | null>(null);

  const handleProfileClick = () => {
    router.push(`/profile/${post.user.username}`);
  };

  const handlePostDetailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.user.username}/post/${post.id}`);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomData && zoomData.currentIndex < zoomData.media.length - 1) {
      setZoomData({ ...zoomData, currentIndex: zoomData.currentIndex + 1 });
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomData && zoomData.currentIndex > 0) {
      setZoomData({ ...zoomData, currentIndex: zoomData.currentIndex - 1 });
    }
  };

  const formattedDate = useMemo(() => {
    const distance = formatDistanceToNow(
      new Date(post.createdAt || new Date()),
      {
        addSuffix: false,
        locale: enUS,
      },
    );

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

  const fullDate = useMemo(
    () =>
      new Date(post.createdAt || new Date()).toLocaleString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [post.createdAt],
  );

  return (
    <>
      <div
        className="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
        onClick={handlePostDetailClick}
      >
        <div className="flex gap-3">
          <AvatarHoverCard
            data={post}
            handleProfileClick={handleProfileClick}
          />

          {/* Post Content */}
          <div className="flex-1">
            <div className="flex items-center gap-x-1">
              <div className="font-bold text-[15px]">
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

            <p className="mt-1 text-[15px] leading-normal text-gray-900">
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

            {/* Reaction Bar */}
            <div
              className="flex items-center justify-between mt-3 text-gray-500 text-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-1 group cursor-pointer">
                  <ReplyPostModal post={post} />
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

      {/* Post-level Image Zoom Dialog */}
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
