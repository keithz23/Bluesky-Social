"use client";

import {
  MessageSquare,
  Repeat2,
  Heart,
  Bookmark,
  Share,
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
import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useRepost } from "@/app/hooks/use-repost";
import { useRouter } from "next/navigation";
import UserHoverCard from "./user-hover-card";
import AvatarHoverCard from "./avatar-hover-card";
import PostDropDown from "../dropdown/post-dropdown";
import {
  BookA,
  Clipboard,
  EyeOff,
  Frown,
  Funnel,
  Smile,
  TriangleAlert,
  UserX,
  VolumeOff,
} from "lucide-react";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";

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
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/profile/${post.user.username}`);
  };

  const dropdownItems: DropdownItem[] = [
    { id: 1, title: "Translate", icon: <BookA size={18} /> },
    { id: 2, title: "Copy post text", icon: <Clipboard size={18} /> },
    { id: 3, title: "Mute thread", icon: <VolumeOff size={18} /> },
    { id: 4, title: "Mute words & tags", icon: <Funnel size={18} /> },
    { id: 5, title: "Hide post for me", icon: <EyeOff size={18} /> },
    { id: 6, title: "Mute account", icon: <VolumeOff size={18} /> },
    { id: 7, title: "Block account", icon: <UserX size={18} /> },
    { id: 8, title: "Report post", icon: <TriangleAlert size={18} /> },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!zoomData) return;
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomData, handleNextImage, handlePrevImage]);

  return (
    <>
      <div
        className="flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
        onClick={handleProfileClick}
      >
        {/* Avatar */}
        <AvatarHoverCard data={bookmark} />

        {/* Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="font-bold text-[15px] hover:underline cursor-pointer">
            <UserHoverCard data={bookmark} />
          </div>

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
              <div className="p-1.5 rounded-full group-hover:bDg-blue-50 transition -ml-1.5">
                <Bookmark className="w-4 h-4" fill="currentColor" />
              </div>
            </button>

            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-full hover:bg-blue-50 hover:text-blue-500 transition cursor-pointer">
                <Share className="w-4 h-4" />
              </button>
              <PostDropDown post={post} items={dropdownItems} />
            </div>
          </div>
        </div>
      </div>

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
          onInteractOutside={(e) => {
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
