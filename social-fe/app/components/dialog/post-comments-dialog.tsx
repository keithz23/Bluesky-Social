"use client";

import { useMemo, useState } from "react";
import { Globe2, MessageSquare, X } from "lucide-react";
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
import LikeButton from "../button/like-button";
import RepostButton from "../button/repost-button";

interface PostCommentsDialogProps {
  post: Feed;
  replyDisabled?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
  onOpenPhotoView?: (open: boolean) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

function ModalPostPreview({ post, onOpenPhotoView }: PostCommentsDialogProps) {
  const hasMedia = post.media?.length > 0;
  const hasTheme = Boolean(post.postTheme);

  return (
    <article className="bg-white">
      <div className="flex items-center justify-between px-3 py-3 sm:px-4">
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
              className="px-3 pb-3 text-[15px] leading-5 text-gray-900 sm:px-4"
            />
          )}

          <div className="w-full bg-gray-100">
            {post.media.length === 1 ? (
              <PhotoProvider
                onVisibleChange={(visible) => onOpenPhotoView?.(visible)}
              >
                <PhotoView src={post.media[0].mediaUrl}>
                  <img
                    src={post.media[0].mediaUrl}
                    alt={post.media[0].altText ?? ""}
                    className="max-h-[52dvh] min-h-48 w-full cursor-pointer object-cover sm:max-h-[58vh] sm:min-h-80"
                  />
                </PhotoView>
              </PhotoProvider>
            ) : (
              <div className={getMediaGridClass(post.media.length)}>
                <PhotoProvider
                  onVisibleChange={(visible) => onOpenPhotoView?.(visible)}
                >
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
      ) : hasTheme ? (
        <div
          className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-gray-100"
          style={{
            background: post.postTheme?.background,
          }}
        >
          <PostContent
            content={post.content}
            className="max-w-xl text-[28px] font-bold leading-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.55)]"
          />
        </div>
      ) : (
        post.content && (
          <PostContent
            content={post.content}
            className="px-3 pb-3 text-[15px] leading-5 text-gray-900 sm:px-4"
          />
        )
      )}
    </article>
  );
}

export default function PostCommentsDialog({
  post,
  replyDisabled = false,
  open,
  onOpenChange,
  hideTrigger = false,
  onDialogOpenChange,
}: PostCommentsDialogProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPhotoView, setIsPhotoView] = useState(false);
  const isOpen = open ?? internalOpen;
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

  const handleOpenChange = (open: boolean) => {
    if (!open && isPhotoView) {
      return;
    }

    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
    onDialogOpenChange?.(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!hideTrigger && (
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
      )}
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => {
          if (isPhotoView) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (isPhotoView) e.preventDefault();
        }}
        className="fixed left-0 top-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-none border-none bg-white p-0 shadow-2xl sm:left-1/2 sm:top-1/2 sm:h-[min(850px,calc(100dvh-2rem))] sm:w-[min(45rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl"
      >
        <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-gray-200 px-12 sm:h-15 sm:px-14">
          <DialogTitle className="truncate text-center text-base font-bold text-gray-950 sm:text-xl">
            {titleName}&apos;s Post
          </DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 sm:right-4 sm:size-9"
              aria-label="Close comments"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>

        <div className="min-h-0 overflow-y-auto overscroll-contain bg-white">
          {isLoadingPost && <PostSkeleton />}

          {detailPost?.parentChain?.map((parent: Feed) => (
            <div key={parent.id} className="border-b border-gray-100">
              <ModalPostPreview
                post={parent}
                onOpenPhotoView={setIsPhotoView}
              />
            </div>
          ))}

          <ModalPostPreview
            post={displayPost}
            onOpenPhotoView={setIsPhotoView}
          />

          <div className="border-b border-gray-200 px-3 py-2 sm:px-4">
            <div className="mb-2 flex items-center justify-between text-[13px] text-gray-600">
              <div className="flex items-center justify-center gap-x-6 sm:gap-x-10">
                <LikeButton
                  isLiked={displayPost?.isLiked}
                  likeCount={displayPost?.likeCount}
                  postId={displayPost?.id}
                />

                <RepostButton
                  isReposted={displayPost?.isReposted}
                  repostCount={displayPost?.repostCount}
                  postId={displayPost?.id}
                />
              </div>

              <div className="flex items-center gap-3">
                <span>{displayPost.replyCount} comments</span>
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
            <div className="flex justify-center px-3 pb-5 pt-2 sm:px-4">
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
          className="shrink-0 border-t border-gray-200"
        />
      </DialogContent>
    </Dialog>
  );
}
