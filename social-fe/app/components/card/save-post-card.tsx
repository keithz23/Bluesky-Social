"use client";

import {
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Share,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBookmark } from "@/app/hooks/use-bookmark";
import { useLike } from "@/app/hooks/use-like";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { PostMedia } from "../../interfaces/post.interface";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRepost } from "@/app/hooks/use-repost";
import { useRouter } from "next/navigation";
import UserHoverCard from "./use-hover-card";
import AvatarHoverCard from "./avatar-hover-card";

const SavedPostCard = ({ bookmark }: { bookmark: any }) => {
  const router = useRouter();
  const post = bookmark.post;
  const [zoomData, setZoomData] = useState<{
    media: PostMedia[];
    currentIndex: number;
  } | null>(null);

  const { mutate: toggleLike } = useLike(post.id, post.isLiked);
  const { mutate: toggleBookmark } = useBookmark(post.id, true);
  const { mutate: toggleRepost } = useRepost(post.id, post.isReposted);

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

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.user.username}`);
  };

  return (
    <>
      <div
        className="flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
        onClick={handleProfileClick}
      >
        {/* Avatar */}
        <AvatarHoverCard post={bookmark} />

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="font-bold text-[15px] hover:underline cursor-pointer">
            <UserHoverCard post={bookmark} />
          </div>

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
                          setZoomData({
                            media: post.media,
                            currentIndex: i,
                          });
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-3 text-gray-500 max-w-md">
            <button className="flex items-center gap-1.5 hover:text-blue-500 transition group cursor-pointer">
              <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition -ml-1.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[13px]">{post.replyCount}</span>
            </button>

            <button
              className="flex items-center gap-1.5 hover:text-green-500 transition group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleRepost();
              }}
            >
              <div className="p-1.5 rounded-full group-hover:bg-green-50 transition -ml-1.5">
                <Repeat2
                  className={`w-4 h-4 transition-colors ${post.isReposted ? "text-green-600" : "group-hover:text-green-600"}`}
                />
              </div>
              <span
                className={`text-[13px] ${post.isReposted ? "text-green-600" : ""}`}
              >
                {post.repostCount}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              className="flex items-center gap-1.5 hover:text-pink-500 transition group cursor-pointer"
            >
              <div className="p-1.5 rounded-full group-hover:bg-pink-50 transition -ml-1.5">
                <Heart
                  className={`w-4 h-4 transition-colors ${post.isLiked ? "fill-pink-500 text-pink-500" : ""}`}
                />
              </div>
              <span
                className={`text-[13px] ${post.isLiked ? "text-pink-500" : ""}`}
              >
                {post.likeCount}
              </span>
            </button>

            {/* Bookmark — click for unbookmark */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark();
              }}
              className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition group cursor-pointer"
            >
              <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition -ml-1.5">
                <Bookmark className="w-4 h-4" fill="currentColor" />
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer">
                <Share className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ĐÃ DI CHUYỂN: Global Image Zoom Dialog ra bên ngoài thẻ div bọc Card */}
      <Dialog
        open={!!zoomData}
        onOpenChange={(open) => {
          if (!open) {
            setZoomData(null);
          }
        }}
      >
        <DialogContent
          className="max-w-7xl w-[95vw] h-[90vh] p-0 border-none bg-black/95 flex items-center justify-center overflow-hidden"
          /* Thêm onInteractOutside để tránh side-effect khi click ra ngoài nếu cần */
          onInteractOutside={(e) => {
            // Tùy chọn: ngăn chặn event click truyền đi khi đóng
            // e.preventDefault();
          }}
        >
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
};

export default SavedPostCard;
