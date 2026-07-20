"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Feed } from "@/app/interfaces/feed.interface";
import Avatar from "../avatar";
import { PostMedia } from "@/app/interfaces/post.interface";
import { PostContent } from "../post-content";
import { useAuth } from "@/app/hooks/use-auth";
import { checkCanReply } from "@/app/utils/check.util";
import { useReplies } from "@/app/hooks/use-reply";
import { useLike } from "@/app/hooks/use-like";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
import CommentComposer from "../dialog/comment-composer";
import { formatCompactDate, formatCount } from "@/app/utils/format.util";
import { VerifiedBadge } from "../verified-badge";
import { PhotoProvider, PhotoView } from "react-photo-view";
import {
  getMediaGridClass,
  getMediaItemClass,
} from "@/app/interfaces/card/card.interface";

interface ReplyCardProps {
  reply: Feed;
  isLastInThread?: boolean;
  disabled?: boolean;
  depth?: 0 | 1;
  parentReply?: Feed;
  onClick?: (reply: Feed) => void;
}

export default function ReplyCard({
  reply,
  isLastInThread = false,
  disabled = false,
  depth = 0,
  parentReply,
  onClick,
}: ReplyCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const requireAuth = useRequireAuthAction();
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyComposer, setShowReplyComposer] = useState(false);
  const isNested = depth === 1;
  const replyTarget = parentReply ?? reply;
  const replyDisabled =
    disabled || (!!user && !checkCanReply(replyTarget, user));
  const { mutate: toggleLike } = useLike(reply.id, reply.isLiked);

  const {
    data: nestedData,
    isLoading: isLoadingNestedReplies,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReplies(reply.id, showReplies && !isNested && reply.replyCount > 0);

  const nestedReplies = useMemo(
    () => nestedData?.pages.flatMap((page) => page.replies ?? []) ?? [],
    [nestedData],
  );

  const handleProfileClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.push(`/profile/${reply.user.username}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!requireAuth()) return;
    toggleLike();
  };

  const handleReplyClick = () => {
    onClick?.(reply);
  };

  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onClick || e.currentTarget !== e.target) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(reply);
    }
  };

  const formattedDate = formatCompactDate(reply.createdAt);

  const likeLabel = formatCount(reply.likeCount, "like");
  const replyPrefix = `${reply.user.displayName || reply.user.username} `;

  return (
    <>
      <div
        className={`transition hover:bg-gray-50/40 ${
          isNested ? "px-0 py-1.5" : "px-4 py-2.5"
        } ${onClick ? "cursor-pointer" : ""} ${
          !isLastInThread && !isNested ? "border-b border-gray-100/70" : ""
        }`}
        onClick={onClick ? handleReplyClick : undefined}
        onKeyDown={handleReplyKeyDown}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="group/comment flex gap-3">
          <Avatar
            data={reply.user}
            onClick={handleProfileClick}
            className={
              isNested
                ? "size-8 text-sm sm:size-8"
                : "size-9 text-base sm:size-10"
            }
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-baseline gap-1">
                  <button
                    type="button"
                    className="max-w-[45%] truncate text-left text-[14px] font-bold text-gray-900 hover:underline"
                    onClick={handleProfileClick}
                  >
                    {reply.user.displayName || reply.user.username}
                  </button>
                  {reply.user.verified && <VerifiedBadge />}
                  <PostContent
                    content={reply.content}
                    className="min-w-0 flex-1 text-[14px] leading-snug text-gray-900 wrap-break-words"
                  />
                </div>

                {reply?.media?.length > 0 && (
                  <PhotoProvider>
                    <div
                      className={getMediaGridClass(reply.media.length)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {reply?.media.map((m: PostMedia, index) => (
                        <PhotoView src={m.mediaUrl} key={m.id}>
                          <div
                            className={`overflow-hidden rounded-xl border border-gray-100 bg-gray-100 ${getMediaItemClass(
                              reply?.media.length,
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
                  className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold text-gray-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-normal" suppressHydrationWarning>
                    {formattedDate}
                  </span>
                  {likeLabel && <span>{likeLabel}</span>}
                  <button
                    type="button"
                    disabled={replyDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!requireAuth()) return;
                      if (onClick) {
                        onClick(reply);
                        return;
                      }
                      setShowReplyComposer((current) => !current);
                    }}
                    className="cursor-pointer text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reply
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLike}
                className="shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-pink-50"
                aria-label={reply.isLiked ? "Unlike reply" : "Like reply"}
              >
                <Heart
                  size={16}
                  strokeWidth={2}
                  className={`transition-colors ${
                    reply.isLiked
                      ? "fill-pink-500 text-pink-500"
                      : "hover:text-pink-500"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {showReplyComposer && (
          <div
            className="ml-12 mt-1.5 sm:ml-[52px]"
            onClick={(e) => e.stopPropagation()}
          >
            <CommentComposer
              post={replyTarget}
              disabled={replyDisabled}
              initialText={replyPrefix}
              autoFocus
              className="px-0 py-0"
              onSubmitted={() => setShowReplyComposer(false)}
            />
          </div>
        )}

        {!isNested && reply.replyCount > 0 && (
          <div className="ml-12 mt-1.5 sm:ml-[52px]">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowReplies((current) => !current);
              }}
              className="flex items-center gap-3 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-900"
            >
              <span className="h-px w-6 bg-gray-300" />
              {showReplies
                ? "Hide replies"
                : `View replies (${reply.replyCount})`}
            </button>

            {showReplies && (
              <div className="mt-1.5">
                {isLoadingNestedReplies && (
                  <div className="pl-2 text-[12px] text-gray-400">
                    Loading replies...
                  </div>
                )}

                {nestedReplies.map((nestedReply, index) => (
                  <ReplyCard
                    key={nestedReply.id}
                    reply={nestedReply}
                    depth={1}
                    parentReply={reply}
                    disabled={disabled}
                    isLastInThread={index === nestedReplies.length - 1}
                  />
                ))}

                {hasNextPage && (
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchNextPage();
                    }}
                    className="ml-2 mt-1 text-[12px] font-semibold text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingNextPage ? "Loading..." : "View more replies"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
