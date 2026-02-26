"use client";

import { useFeed } from "@/app/hooks/use-feed";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { Feed } from "../interfaces/feed.interface";
import PostCard from "../components/card/post-card";
import { useAuth } from "../hooks/use-auth";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeed();

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: posts.length > 0,
  });

  return (
    <>
      {/* Header Tabs */}
      {isAuthenticated ? (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between px-4 pt-2"></div>

          <div className="flex text-[15px] h-13 items-center overflow-x-auto px-4 gap-7 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="h-full flex items-center cursor-pointer hover:opacity-80 transition relative p-5">
              <span className="font-bold text-gray-900">Discover</span>
              <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-500 rounded-t-full"></div>
            </div>

            <div className="h-full flex items-center cursor-pointer hover:opacity-80 transition p-5">
              <span className="font-semibold text-gray-500">Following</span>
            </div>

            <div className="h-full flex items-center cursor-pointer hover:opacity-80 transition p-5">
              <span className="font-semibold text-gray-500">Video</span>
            </div>

            <div className="h-full flex items-center cursor-pointer hover:opacity-80 transition p-5">
              <span className="font-semibold text-gray-500 whitespace-nowrap">
                Popular With Friends
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="flex text-md font-bold h-13 items-center">
            <div className="flex-1 text-center border-b-2 border-blue-500 h-full flex items-center justify-center cursor-pointer hover:bg-gray-50 transition">
              Discover
            </div>
            <div className="flex-1 text-center h-full flex items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition">
              Feeds ✨
            </div>
          </div>
        </div>
      )}

      {/* Feed List */}
      <div className="flex flex-col">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}

        {posts.map((post: Feed) => (
          <PostCard key={post.id} post={post} />
        ))}

        {/* Trigger infinite scroll */}
        <div ref={ref} className="py-4 text-center text-sm text-gray-400">
          {isFetchingNextPage
            ? "Loading more..."
            : !hasNextPage && posts.length > 0
              ? "You're all caught up"
              : null}
        </div>
      </div>
    </>
  );
}
