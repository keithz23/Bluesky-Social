"use client";
import { useDebounce } from "@/app/hooks/use-debounce";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useListPosts } from "@/app/hooks/use-list";
import { useSearchPosts } from "@/app/hooks/use-post";
import { Feed } from "@/app/interfaces/feed.interface";
import { formatCompactDate } from "@/app/utils/format.util";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, ImageIcon, Loader2, Search, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import Avatar from "../avatar";

interface AddPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: string;
  currentPostIds?: string[];
}

export default function AddPostDialog({
  open,
  onOpenChange,
  listId,
  currentPostIds = [],
}: AddPostDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [postOverrides, setPostOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [loadingPostId, setLoadingPostId] = useState<string | null>(null);
  const trimmedQuery = searchQuery.trim();
  const debouncedQuery = useDebounce(trimmedQuery, 350);
  const hasQuery = debouncedQuery.length > 0;
  const { addPostMutation, removePostMutation } = useListPosts();

  const {
    data: postPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPosts,
    isFetching: isFetchingPosts,
  } = useSearchPosts(debouncedQuery, { ownOnly: true });

  const posts = useMemo(
    () => postPages?.pages.flatMap((page) => page.posts) ?? [],
    [postPages],
  );
  const currentPostIdSet = useMemo(
    () => new Set(currentPostIds),
    [currentPostIds],
  );

  const { ref } = useInfiniteScroll({
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    enabled: hasQuery && posts.length > 0,
  });

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery("");
    setPostOverrides({});
    setLoadingPostId(null);
  };

  const togglePostListStatus = (postId: string, isAdded: boolean) => {
    if (loadingPostId) return;

    setLoadingPostId(postId);

    if (isAdded) {
      removePostMutation.mutate(
        { listId, postId },
        {
          onSuccess: () => {
            setPostOverrides((prev) => ({ ...prev, [postId]: false }));
          },
          onSettled: () => setLoadingPostId(null),
        },
      );
      return;
    }

    addPostMutation.mutate(
      { listId, postId },
      {
        onSuccess: () => {
          setPostOverrides((prev) => ({ ...prev, [postId]: true }));
        },
        onSettled: () => setLoadingPostId(null),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) =>
        nextOpen ? onOpenChange(true) : handleClose()
      }
    >
      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-125 w-full h-[80vh] max-h-150 rounded-2xl flex flex-col [&>button]:hidden bg-white">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Add post to list
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="flex items-center gap-3 px-5 pb-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-[#1185fe]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search your posts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[16px] text-gray-900 placeholder-gray-500 outline-none"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {hasQuery &&
          (isLoadingPosts || (isFetchingPosts && posts.length === 0)) ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-[#1185fe] animate-spin" />
            </div>
          ) : null}

          <div className="flex flex-col">
            {posts.map((post: Feed) => {
              const isAdded =
                postOverrides[post.id] ?? currentPostIdSet.has(post.id);
              const isHandling = loadingPostId === post.id;
              const firstMedia = post.media?.[0];

              return (
                <div
                  key={post.id}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <Avatar data={post.user} className="size-10 sm:size-10" />

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-1">
                      <span className="truncate text-[15px] font-bold text-gray-900">
                        {post.user.displayName || post.user.username}
                      </span>
                      {post.user.verified && (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-[#1185fe]" />
                      )}
                      <span className="shrink-0 text-[14px] text-gray-500">
                        @{post.user.username}
                      </span>
                      {post.createdAt && (
                        <span
                          className="shrink-0 text-[14px] text-gray-500"
                          suppressHydrationWarning
                        >
                          {formatCompactDate(post.createdAt)}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-[15px] leading-snug text-gray-800">
                      {post.content || "Media post"}
                    </p>

                    {firstMedia && (
                      <div className="mt-2 flex w-fit items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 pr-2 text-[13px] text-gray-500">
                        <div className="h-12 w-12 overflow-hidden rounded-l-lg bg-gray-100">
                          <Image
                            src={firstMedia.mediaUrl}
                            alt={firstMedia.altText ?? ""}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <ImageIcon className="h-4 w-4" />
                        <span>{post.media.length}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => togglePostListStatus(post.id, isAdded)}
                    disabled={isHandling || Boolean(loadingPostId)}
                    className={`mt-1 flex h-8.5 min-w-18 shrink-0 items-center justify-center rounded-full px-4 text-[14px] font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 ${
                      isAdded
                        ? "bg-[#F1F5F9] text-[#334155] hover:bg-[#e2e8f0]"
                        : "bg-[#1185fe] text-white hover:bg-blue-600"
                    }`}
                  >
                    {isHandling ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : isAdded ? (
                      "Remove"
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {hasQuery && hasNextPage && (
            <div ref={ref} className="h-14 flex items-center justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>
          )}

          {!hasQuery && (
            <div className="px-8 py-14 text-center">
              <Search
                className="mx-auto mb-4 h-10 w-10 text-gray-300"
                strokeWidth={1.5}
              />
              <p className="text-[15px] font-medium text-gray-700">
                Search your posts to add one to this list.
              </p>
            </div>
          )}

          {hasQuery && !isFetchingPosts && posts.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-[15px]">
              No posts found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
