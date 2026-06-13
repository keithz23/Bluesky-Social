"use client";

import ListItem from "@/app/components/list-item";
import { InfiniteScrollFooter, ListSkeleton } from "@/app/components/skeletons";
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
      {isLoading && <ListSkeleton />}

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
      <InfiniteScrollFooter
        refCallback={ref}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={lists.length > 0}
      />
    </div>
  );
}
