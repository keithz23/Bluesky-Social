"use client";

import { Loader2 } from "lucide-react";

export function PostSkeleton({ avatarSize = "h-10 w-10" }: { avatarSize?: string }) {
  return (
    <div className="p-4 border-b border-gray-100 animate-pulse">
      <div className="flex gap-3">
        <div className={`${avatarSize} rounded-full bg-gray-200 shrink-0`} />
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="h-4 bg-gray-200 rounded w-1/3 max-w-40" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function PostSkeletonList({
  count = 5,
  avatarSize,
}: {
  count?: number;
  avatarSize?: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} avatarSize={avatarSize} />
      ))}
    </>
  );
}

export function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-4 border-b border-gray-100 animate-pulse flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex flex-col gap-2 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="w-24 h-8 bg-gray-200 rounded-full shrink-0" />
          </div>
          <div className="ml-15 flex flex-col gap-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2.5 p-4 border-b border-gray-100 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 shrink-0 bg-gray-200 rounded-lg" />
            <div className="flex flex-col justify-center gap-2 min-w-0">
              <div className="h-4 w-32 bg-gray-200 rounded-md" />
              <div className="h-3 w-48 max-w-full bg-gray-200 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="h-3.5 w-3/4 bg-gray-200 rounded-md" />
            <div className="h-3.5 w-1/2 bg-gray-200 rounded-md" />
          </div>
        </div>
      ))}
    </>
  );
}

export function ListDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-20 animate-pulse">
      <div className="sticky top-0 h-14 bg-white/90 border-b border-gray-100" />
      <div className="px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 shrink-0 bg-gray-200 rounded-lg" />
          <div className="flex flex-col gap-2">
            <div className="h-6 w-40 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
      </div>
      <div className="flex border-b border-gray-200 mt-2">
        <div className="flex-1 px-4 py-4">
          <div className="h-4 bg-gray-200 rounded" />
        </div>
        <div className="flex-1 px-4 py-4">
          <div className="h-4 bg-gray-200 rounded" />
        </div>
      </div>
      <PostSkeletonList count={3} />
    </div>
  );
}

export function NotificationSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex gap-3 px-4 py-3 border-b border-gray-100 animate-pulse"
        >
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </>
  );
}

export function ConversationSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col p-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 animate-pulse">
          <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="h-2.5 bg-gray-100 rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex-1 flex flex-col justify-end gap-3 p-4 animate-pulse">
      <div className="self-start h-10 w-44 rounded-2xl bg-gray-100" />
      <div className="self-end h-10 w-52 rounded-2xl bg-blue-100" />
      <div className="self-start h-16 w-60 rounded-2xl bg-gray-100" />
      <div className="self-end h-10 w-36 rounded-2xl bg-blue-100" />
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20 animate-pulse">
      <div className="h-32 bg-gray-200" />
      <div className="flex justify-end gap-2 px-4 pt-3">
        <div className="h-8 w-24 bg-gray-200 rounded-full" />
        <div className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
      <div className="px-4 mt-12 flex flex-col gap-2">
        <div className="h-5 w-36 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded mt-2" />
      </div>
      <div className="flex border-b border-gray-200 mt-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex-1 px-4 py-3">
            <div className="h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InfiniteScrollFooter({
  refCallback,
  isFetchingNextPage,
  hasNextPage,
  hasItems,
  showLoadingIndicator = true,
}: {
  refCallback?: (node?: Element | null) => void;
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  hasItems: boolean;
  showLoadingIndicator?: boolean;
}) {
  if (!hasItems) return <div ref={refCallback} />;

  if (hasNextPage && !showLoadingIndicator) {
    return <div ref={refCallback} className="h-px" aria-hidden="true" />;
  }

  return (
    <div
      ref={refCallback}
      className="min-h-12 py-4 flex items-center justify-center text-sm text-gray-400"
    >
      {isFetchingNextPage ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading more
        </span>
      ) : !hasNextPage ? (
        "You're all caught up"
      ) : null}
    </div>
  );
}
