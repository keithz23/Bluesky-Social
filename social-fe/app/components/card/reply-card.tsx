"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  MessageSquare,
  Repeat,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Feed } from "@/app/interfaces/feed.interface";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import Avatar from "../avatar";
import { PostMedia } from "@/app/interfaces/post.interface";
import ReplyPostModal from "../dialog/reply-post-dialog";

interface ReplyCardProps {
  reply: Feed;
  isLastInThread?: boolean;
}

export default function ReplyCard({
  reply,
  isLastInThread = false,
}: ReplyCardProps) {
  const router = useRouter();

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${reply.user.username}`);
  };

  const [zoomData, setZoomData] = useState<{
    media: PostMedia[];
    currentIndex: number;
  } | null>(null);

  const handleReplyClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${reply.user.username}/post/${reply.id}`);
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

  return (
    <>
      <div
        className={`px-4 py-3 hover:bg-gray-50/30 transition cursor-pointer ${!isLastInThread ? "border-b border-gray-100" : ""}`}
        onClick={handleReplyClick}
      >
        <div className="flex gap-3">
          {/* Avatar Section */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <Avatar data={reply.user} />
          </div>

          {/* Main Content Section */}
          <div className="flex-1 min-w-0">
            {/* Header: Name, Handle, Time */}
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-1 overflow-hidden">
                <div
                  className="font-bold text-[15px] hover:underline truncate"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProfileClick?.();
                    }}
                  >
                    {reply.user.username}
                  </button>
                </div>
                <span className="text-gray-500 text-[15px] truncate">
                  @{reply.user.username}
                </span>
                <span className="text-gray-500 text-[15px]">·</span>
                <span
                  className="text-gray-500 text-[15px] hover:underline whitespace-nowrap"
                  suppressHydrationWarning
                >
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Reply Text */}
            <p className="text-[15px] leading-snug text-gray-900 wrap-break-words mb-2 mt-0.5">
              {reply.content}
            </p>

            {reply?.media?.length > 0 && (
              <Carousel opts={{ align: "start" }} className="w-full mb-3">
                <CarouselContent>
                  {reply?.media.map((m: PostMedia, i: number) => (
                    <CarouselItem
                      key={m.id}
                      className={
                        reply?.media.length === 1 ? "basis-full" : "basis-[85%]"
                      }
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomData({
                            media: reply?.media,
                            currentIndex: i,
                          });
                        }}
                        className={`w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-100 ${reply?.media.length === 1 ? "aspect-video" : "h-64"}`}
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

            {/* Action Bar */}
            <div
              className="flex items-center justify-between mt-1 text-gray-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-10">
                {/* Reply */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <ReplyPostModal post={reply} />
                  {reply.replyCount > 0 && (
                    <span className="text-[13px] group-hover:text-blue-500">
                      {reply.replyCount}
                    </span>
                  )}
                </div>

                {/* Repost */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <div
                    className={`p-1.5 rounded-full group-hover:bg-green-50 transition-colors ${reply.isReposted ? "text-green-600" : ""}`}
                  >
                    <Repeat size={18} className="group-hover:text-green-500" />
                  </div>
                  {reply.repostCount > 0 && (
                    <span
                      className={`text-[13px] group-hover:text-green-500 ${reply.isReposted ? "text-green-600" : ""}`}
                    >
                      {reply.repostCount}
                    </span>
                  )}
                </div>

                {/* Like */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <div
                    className={`p-1.5 rounded-full group-hover:bg-pink-50 transition-colors ${reply.isLiked ? "text-pink-600" : ""}`}
                  >
                    <Heart
                      size={18}
                      className={`group-hover:text-pink-500 ${reply.isLiked ? "fill-pink-600 text-pink-600" : ""}`}
                    />
                  </div>
                  {reply.likeCount > 0 && (
                    <span
                      className={`text-[13px] group-hover:text-pink-500 ${reply.isLiked ? "text-pink-600" : ""}`}
                    >
                      {reply.likeCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Action Icons (Bookmark, Share, More) */}
              <div className="flex items-center gap-1">
                <div className="p-1.5 rounded-full hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Bookmark
                    size={18}
                    className={`group-hover:text-blue-500 ${reply.isBookmarked ? "fill-blue-500 text-blue-500" : ""}`}
                  />
                </div>
                <div className="p-1.5 rounded-full hover:bg-blue-50 transition-colors group cursor-pointer">
                  <Share size={18} className="group-hover:text-blue-500" />
                </div>
                <div className="p-1.5 rounded-full hover:bg-blue-50 transition-colors group cursor-pointer">
                  <MoreHorizontal
                    size={18}
                    className="group-hover:text-blue-500"
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
