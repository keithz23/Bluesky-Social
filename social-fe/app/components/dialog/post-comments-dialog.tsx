"use client";

import { useMemo, useState } from "react";
import { Globe2, MessageSquare, ThumbsUp, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Feed } from "@/app/interfaces/feed.interface";
import { useAuth } from "@/app/hooks/use-auth";
import { useGetPostById } from "@/app/hooks/use-post";
import { usePostRoom } from "@/app/hooks/use-post-room";
import { useReplies } from "@/app/hooks/use-reply";
import { checkCanReply } from "@/app/utils/check.util";
import ReplyCard from "../card/reply-card";
import { InfiniteScrollFooter, PostSkeleton } from "../skeletons";
import Avatar from "../avatar";
import { PostContent } from "../post-content";
import CommentComposer from "./comment-composer";
import { formatCompactDate } from "@/app/utils/format.util";
import { PhotoProvider, PhotoView } from "react-photo-view";
import {
  getMediaGridClass,
  getMediaItemClass,
} from "@/app/interfaces/card/card.interface";

interface PostCommentsDialogProps {
  post: Feed;
  replyDisabled?: boolean;
}

function ModalPostPreview({ post }: { post: Feed }) {
  const hasMedia = post.media?.length > 0;

  return (
    <article className="bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative shrink-0">
            <Avatar data={post.user} className="size-10 text-base sm:size-10" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-gray-900">
              {post.user.displayName || post.user.username}
            </p>
            <div className="flex items-center gap-1 text-[13px] text-gray-500">
              <span>{post.user.username}</span>
              {post.createdAt && (
                <>
                  <span
                    className="size-0.5 rounded-full bg-gray-500"
                    aria-hidden="true"
                  />
                  <span suppressHydrationWarning>
                    {formatCompactDate(post.createdAt)}
                  </span>
                </>
              )}
              <span
                className="size-0.5 rounded-full bg-gray-500"
                aria-hidden="true"
              />
              <Globe2 className="size-3.5" aria-label="Public" />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="rounded-full px-2 py-1 text-xl leading-none text-gray-600 transition-colors hover:bg-gray-100"
          aria-label="More post actions"
        >
          ...
        </button>
      </div>

      {hasMedia ? (
        <>
          {post.content && (
            <PostContent
              content={post.content}
              className="px-4 pb-3 text-[15px] leading-5 text-gray-900"
            />
          )}

          <div className="w-full bg-gray-100">
            {post.media.length === 1 ? (
              <PhotoProvider>
                <PhotoView src={post.media[0].mediaUrl}>
                  <img
                    src={post.media[0].mediaUrl}
                    alt={post.media[0].altText ?? ""}
                    className="max-h-[58vh] min-h-80 w-full object-cover"
                  />
                </PhotoView>
              </PhotoProvider>
            ) : (
              <div className={getMediaGridClass(post.media.length)}>
                <PhotoProvider>
                  {post.media.slice(0, 4).map((media, index) => (
                    <PhotoView src={media.mediaUrl} key={index}>
                      <div
                        className={`overflow-hidden rounded-xl border border-gray-100 bg-gray-100 ${getMediaItemClass(
                          post.media.length,
                          index,
                        )}`}
                      >
                        <img
                          key={media.id || index}
                          src={media.mediaUrl}
                          alt={media.altText ?? ""}
                          className="h-full min-h-40 w-full object-cover"
                        />
                      </div>
                    </PhotoView>
                  ))}
                </PhotoProvider>
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100"
          style={{
            background: post.postTheme?.background ?? "#f3f4f6",
          }}
        >
          <PostContent
            content={post.content}
            className="max-w-xl text-[28px] font-bold leading-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]"
          />
        </div>
      )}
    </article>
  );
}

export default function PostCommentsDialog({
  post,
  replyDisabled = false,
}: PostCommentsDialogProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { data: detailPost, isLoading: isLoadingPost } = useGetPostById(
    post.id,
    isOpen,
  );
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useReplies(
    post.id,
    isOpen,
  );

  usePostRoom(isOpen ? post.id : undefined);

  const displayPost = detailPost ?? post;
  const replies = useMemo(
    () => data?.pages.flatMap((page) => page.replies ?? []) ?? [],
    [data],
  );
  const disableReply =
    replyDisabled || (user ? !checkCanReply(displayPost, user) : false);
  const titleName =
    displayPost.user.displayName || displayPost.user.username || "Post";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Open comments"
          className="flex cursor-pointer items-center gap-1 rounded-full transition-colors hover:text-blue-500"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="rounded-full p-1.5 transition-colors group-hover:bg-blue-50 sm:p-2">
            <MessageSquare
              size={18}
              strokeWidth={2.2}
              className="transition-colors group-hover:text-blue-500"
            />
          </span>
          <span className="text-[13px] group-hover:text-blue-500 sm:text-sm">
            {post.replyCount}
          </span>
        </button>
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="h-[min(850px,calc(100vh-2rem))] w-[calc(100vw-1.5rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl sm:w-180 sm:max-w-none"
      >
        <div className="relative flex h-15 items-center justify-center border-b border-gray-200 px-14">
          <DialogTitle className="truncate text-center text-xl font-bold text-gray-950">
            {titleName}&apos;s Post
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-4 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
              aria-label="Close comments"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>

        <div className="min-h-0 overflow-y-auto bg-white">
          {isLoadingPost && <PostSkeleton />}

          {detailPost?.parentChain?.map((parent: Feed) => (
            <div key={parent.id} className="border-b border-gray-100">
              <ModalPostPreview post={parent} />
            </div>
          ))}

          <ModalPostPreview post={displayPost} />

          <div className="border-b border-gray-200 px-4 py-2">
            <div className="mb-2 flex items-center justify-between text-[13px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-500 text-white">
                  <ThumbsUp className="size-3 fill-current" />
                </span>
                <span>{displayPost.likeCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{displayPost.replyCount} comments</span>
                <span>{displayPost.repostCount} shares</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            {replies.map((reply, index) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                isLastInThread={index === replies.length - 1}
              />
            ))}
          </div>

          <InfiniteScrollFooter
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            hasItems={replies.length > 0}
            showLoadingIndicator={false}
          />

          {hasNextPage && (
            <div className="flex justify-center px-4 pb-5 pt-2">
              <button
                type="button"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isFetchingNextPage ? "Loading..." : "View more comments"}
              </button>
            </div>
          )}
        </div>

        <CommentComposer
          post={displayPost}
          disabled={disableReply}
          className="border-t border-gray-200"
        />
      </DialogContent>
    </Dialog>
  );
}
