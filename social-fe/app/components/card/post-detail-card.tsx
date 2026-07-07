"use client";

import { useMemo, useCallback } from "react";
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
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import ReplyPostModal from "../dialog/reply-post-dialog";
import { REPLY_POLICY_CONFIG } from "@/app/constants/reply-policy.constant";
import PostDropDown from "../dropdown/post-dropdown";
import { dropdownItems } from "@/app/constants/dropdown.constant";
import { PostContent } from "../post-content";
import RepostButton from "../button/repost-button";
import LikeButton from "../button/like-button";
import BookMarkButton from "../button/bookmark-button";
import { toast } from "sonner";
import { useAuth } from "@/app/hooks/use-auth";
import { checkCanReply } from "@/app/utils/check.util";
import { PhotoProvider, PhotoView } from "react-photo-view";

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
  const replyDisabled = disabled || (!!user && !checkCanReply(post, user));

  const handlePostClick = () => {
    if (role === "parent") {
      router.push(`/profile/${post.user.username}/post/${post.id}`);
    }
  };

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${post.user.username}`);
  };

  const handleShare = useCallback(
    async (e?: React.MouseEvent) => {
      e?.stopPropagation();
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

  const policyConfig =
    REPLY_POLICY_CONFIG[post.replyPolicy as keyof typeof REPLY_POLICY_CONFIG] ||
    REPLY_POLICY_CONFIG.ANYONE;

  const PolicyIcon = policyConfig.icon;

  return (
    <>
      <div
        className={`relative px-4 py-3 cursor-pointer transition ${role === "parent"
          ? "hover:bg-gray-50/30 z-0"
          : "border-b border-gray-100 hover:bg-gray-50/30 z-10"
          }`}
        onClick={handlePostClick}
      >
        <div className="flex gap-3">
          {/* Avatar Section */}
          <div className="flex flex-col items-center shrink-0 relative">
            <div className="z-10" onClick={(e) => e.stopPropagation()}>
              <AvatarHoverCard
                data={post}
                handleProfileClick={handleProfileClick}
              />
            </div>

            {role === "parent" && (
              <div className="absolute top-10 bottom-3 w-0.5 bg-gray-200 z-0" />
            )}
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
                <PostDropDown post={post} items={dropdownItems} />
              </div>
            </div>

            {/* Post Text */}

            <PostContent
              content={post.content}
              className={`leading-snug text-gray-900 wrap-break-words mb-3 ${role === "main" ? "text-[17px]" : "text-[15px]"
                }`}
            />

            {post.media?.length > 0 && (
              <Carousel opts={{ align: "start" }} className="mb-2 w-full sm:mb-3">
                <CarouselContent onClick={(e) => e.stopPropagation()}>
                  <PhotoProvider>
                    {post.media.map((m: PostMedia) => (
                      <PhotoView src={m.mediaUrl} key={m.id}>
                        <CarouselItem
                          className={
                            post.media.length === 1
                              ? "basis-full"
                              : "basis-[88%] sm:basis-[85%]"
                          }
                        >
                          <div
                            className={`w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-100 ${post.media.length === 1
                              ? "aspect-video"
                              : "h-56 sm:h-64"
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
                      </PhotoView>
                    ))}
                  </PhotoProvider>
                </CarouselContent>
              </Carousel>
            )}

            {role === "main" && (
              <div className="flex items-center flex-wrap gap-1.5 text-[14px] text-gray-500 mb-3 mt-1">
                <span>
                  {new Date(post.createdAt || "").toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>

                <span>·</span>

                <span>
                  {new Date(post.createdAt || "").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                {/* Reply Policy */}
                <div className="flex items-center gap-1 ml-1">
                  <PolicyIcon size={14} />
                  <span>
                    <span>{policyConfig.text}</span>
                  </span>
                </div>
              </div>
            )}

            {role === "main" && (
              <div className="flex items-center gap-4 py-3 border-y border-gray-100 text-[14px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-gray-900">
                    {post.repostCount}
                  </span>
                  <span className="text-gray-500">reposts</span>
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
            )}

            {/* Reaction Icons */}
            <div
              className="flex items-center justify-between mt-2 px-1 text-gray-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-10">
                {/* Reply */}
                <div className="flex items-center gap-1.5 group cursor-pointer">
                  <ReplyPostModal
                    post={post}
                    type="icon"
                    disabled={replyDisabled}
                  />
                  <span className="text-[13px] group-hover:text-blue-500">
                    {post.replyCount}
                  </span>
                </div>
                {/* Repost */}
                <RepostButton
                  postId={post.id}
                  isReposted={post.isReposted}
                  repostCount={post.repostCount}
                />
                {/* Like */}
                <LikeButton
                  postId={post.id}
                  isLiked={post.isLiked}
                  likeCount={post.likeCount}
                />
              </div>

              <div className="flex items-center gap-1">
                <BookMarkButton
                  postId={post.id}
                  isBookmarked={post.isBookmarked}
                  bookmarkCount={post.bookmarkCount}
                />
                <button
                  type="button"
                  onClick={handleShare}
                  className="p-2 rounded-full hover:bg-blue-50 transition-colors group cursor-pointer"
                >
                  <Share size={19} className="group-hover:text-blue-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
