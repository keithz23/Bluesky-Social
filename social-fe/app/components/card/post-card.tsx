"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Share } from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
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
import PostCommentsDialog from "../dialog/post-comments-dialog";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";
import { PostContent } from "../post-content";
import { toast } from "sonner";
import { useAuth } from "@/app/hooks/use-auth";
import { checkCanReply } from "@/app/utils/check.util";
import { formatCompactDate, formatFullDate } from "@/app/utils/format.util";

interface PostCardProps {
  post: Feed;
  dropdownItems: DropdownItem[];
}

const getMediaGridClass = (count: number) => {
  if (count === 1) return "mt-2 mb-2 w-full sm:mb-3";
  if (count === 3) {
    return "mt-2 mb-2 grid h-72 w-full grid-cols-2 grid-rows-2 gap-1 sm:mb-3 sm:h-80";
  }
  return "mt-2 mb-2 grid w-full grid-cols-2 gap-1 sm:mb-3";
};

const getMediaItemClass = (count: number, index: number) => {
  if (count === 1) return "aspect-video";
  if (count === 3 && index === 0) return "row-span-2 h-full";
  return "aspect-square";
};

function PostCardComponent({ post, dropdownItems }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const replyDisabled = !!user && !checkCanReply(post, user);

  const handleProfileClick = useCallback(() => {
    router.push(`/profile/${post.user.username}`);
  }, [router, post.user.username]);

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const url = `${window.location.origin}/profile/${post.user.username}/post/${post.id}`;

      if (navigator.share) {
        await navigator.share({ text: post.content, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Post link copied");
    },
    [post.content, post.id, post.user.username],
  );

  const formattedDate = formatCompactDate(post.createdAt);
  const fullDate = formatFullDate(post.createdAt);
  const hasContent = post.content.trim().length > 0;
  const shouldShowContentFrame = Boolean(post.postTheme);

  return (
    <div className="border-b border-gray-100 p-3 transition sm:p-4 cursor-pointer">
      <div className="flex min-w-0 gap-2.5 sm:gap-3">
        <AvatarHoverCard data={post} handleProfileClick={handleProfileClick} />

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-x-1">
            <div className="min-w-0 truncate text-[15px] font-bold">
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

          {shouldShowContentFrame ? (
            <div
              className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100"
              style={{
                background: post.postTheme?.background ?? "#f3f4f6",
              }}
            >
              <PostContent content={post.content} />
            </div>
          ) : (
            <PostContent content={post.content} />
          )}

          {post.media?.length > 0 && (
            <PhotoProvider>
              <div
                className={getMediaGridClass(post.media.length)}
                onClick={(e) => e.stopPropagation()}
              >
                {post.media.map((m: PostMedia, index) => (
                  <PhotoView src={m.mediaUrl} key={m.id}>
                    <div
                      className={`cursor-zoom-in overflow-hidden rounded-xl border border-gray-100 bg-gray-100 ${getMediaItemClass(
                        post.media.length,
                        index,
                      )}`}
                    >
                      <img
                        src={m.mediaUrl}
                        alt={m.altText ?? ""}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </PhotoView>
                ))}
              </div>
            </PhotoProvider>
          )}

          <div
            className="mt-2 flex items-center justify-between gap-1 overflow-hidden text-xs text-gray-500 sm:mt-3 sm:text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex min-w-0 flex-1 items-center justify-between gap-1 sm:justify-start sm:gap-8">
              <div className="flex items-center gap-1 group cursor-pointer">
                <PostCommentsDialog post={post} replyDisabled={replyDisabled} />
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

            <div className="flex shrink-0 items-center gap-0 sm:gap-2">
              <BookMarkButton
                postId={post.id}
                isBookmarked={post.isBookmarked}
                bookmarkCount={post.bookmarkCount}
              />
              <button
                type="button"
                onClick={handleShare}
                className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-2"
              >
                <Share size={18} strokeWidth={2.2} />
              </button>
              <div className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-gray-100 sm:p-2">
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
    prev.post.content === next.post.content &&
    prev.post.updatedAt === next.post.updatedAt &&
    prev.post.media === next.post.media &&
    prev.post.isLiked === next.post.isLiked &&
    prev.post.likeCount === next.post.likeCount &&
    prev.post.isReposted === next.post.isReposted &&
    prev.post.repostCount === next.post.repostCount &&
    prev.post.isBookmarked === next.post.isBookmarked &&
    prev.post.bookmarkCount === next.post.bookmarkCount &&
    prev.post.replyCount === next.post.replyCount &&
    prev.dropdownItems === next.dropdownItems
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
