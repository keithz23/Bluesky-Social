"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Share } from "lucide-react";
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
import ReplyPostModal from "../dialog/reply-post-dialog";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";
import { PostContent } from "../post-content";
import { ZoomData } from "../dialog/image-zoom-dialog";

interface PostCardProps {
  post: Feed;
  dropdownItems: DropdownItem[];
  onZoom: (data: ZoomData) => void;
}

function PostCardComponent({ post, dropdownItems, onZoom }: PostCardProps) {
  const router = useRouter();

  const handleProfileClick = useCallback(() => {
    router.push(`/profile/${post.user.username}`);
  }, [router, post.user.username]);

  const handlePostDetailClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/profile/${post.user.username}/post/${post.id}`);
    },
    [router, post.user.username, post.id],
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      onZoom({ media: post.media, currentIndex: index });
    },
    [onZoom, post.media],
  );

  const formattedDate = useMemo(() => {
    const distance = formatDistanceToNow(
      new Date(post.createdAt || new Date()),
      { addSuffix: false, locale: enUS },
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
    <div
      className="p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
      onClick={handlePostDetailClick}
    >
      <div className="flex gap-3">
        <AvatarHoverCard data={post} handleProfileClick={handleProfileClick} />

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

          <PostContent content={post.content} />

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
                      onClick={(e) => handleImageClick(e, i)}
                      className={`w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-100 ${
                        post.media.length === 1 ? "aspect-video" : "h-64"
                      }`}
                    >
                      <img
                        src={m.mediaUrl}
                        alt={m.altText ?? ""}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}

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
                <PostDropDown post={post} items={dropdownItems} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PostCard = React.memo(PostCardComponent, (prev, next) => {
  return (
    prev.post.id === next.post.id &&
    // prev.post.updatedAt === next.post.updatedAt &&
    prev.post.isLiked === next.post.isLiked &&
    prev.post.likeCount === next.post.likeCount &&
    prev.post.isReposted === next.post.isReposted &&
    prev.post.repostCount === next.post.repostCount &&
    prev.post.isBookmarked === next.post.isBookmarked &&
    prev.post.bookmarkCount === next.post.bookmarkCount &&
    prev.post.replyCount === next.post.replyCount &&
    prev.dropdownItems === next.dropdownItems &&
    prev.onZoom === next.onZoom
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
