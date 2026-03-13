"use client";

import ListItem from "@/app/components/list-item";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useGetlists } from "@/app/hooks/use-list";

export default function ListsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetlists();

  const lists = data?.pages.flatMap((page) => page.lists) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: lists.length > 0,
  });

  return (
    <div>
      {isLoading &&
        Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2.5 p-4 border-b border-gray-100 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 shrink-0 bg-gray-200 rounded-xl"></div>
              <div className="flex flex-col justify-center gap-2">
                <div className="h-4 w-32 bg-gray-200 rounded-md"></div>
                <div className="h-3 w-48 bg-gray-200 rounded-md"></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="h-3.5 w-3/4 bg-gray-200 rounded-md"></div>
              <div className="h-3.5 w-1/2 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        ))}

      {!isLoading && lists.length > 0 && (
        <div className="flex flex-col w-full">
          {lists.map((list) => (
            <ListItem item={list} key={list?.id} />
          ))}
        </div>
      )}

      {!isLoading && lists.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-32 px-4">
          <div className="mb-6 p-4 bg-gray-50 rounded-full text-gray-400">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="9" r="1.5" />
              <path d="M12 9h5" />
              <circle cx="8" cy="15" r="1.5" />
              <path d="M12 15h5" />
            </svg>
          </div>

          <p className="text-gray-500 text-[15px] text-center leading-relaxed">
            Lists allow you to see content
            <br />
            from your favorite people.
          </p>
        </div>
      )}

      {/* --- INFINITE SCROLL TRIGGER (LOAD MORE) --- */}
      {lists.length > 0 && (
        <div
          ref={ref}
          className="py-6 text-center text-[13px] font-medium text-gray-400"
        >
          {isFetchingNextPage
            ? "Loading more..."
            : !hasNextPage
              ? "You're all caught up"
              : null}
        </div>
      )}
    </div>
  );
}
