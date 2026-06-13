"use client";

import { useMemo, useCallback } from "react";
import { useFeed } from "@/app/hooks/use-feed";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { Feed } from "../interfaces/feed.interface";
import { useAuth } from "../hooks/use-auth";
import { dropdownItems as staticDropdownItems } from "../constants/dropdown.constant";
import { useGlobal } from "../hooks/use-global";
import { ArrowUp } from "lucide-react";
import { useState } from "react";
import ImageZoomDialog, {
  ZoomData,
} from "../components/dialog/image-zoom-dialog";
import VirtualPostList from "../components/virtual-post-list";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
} from "../components/skeletons";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const { hasNewPosts, refreshFeed } = useGlobal();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useFeed();

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data],
  );

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: posts.length > 0,
  });

  const [zoomData, setZoomData] = useState<ZoomData | null>(null);
  const handleCloseZoom = useCallback(() => setZoomData(null), []);
  const handleChangeZoomIndex = useCallback(
    (index: number) =>
      setZoomData((prev) => (prev ? { ...prev, currentIndex: index } : null)),
    [],
  );

  const dropdownItems = useMemo(() => staticDropdownItems, []);

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

      {hasNewPosts && (
        <div className="flex justify-center">
          <button
            onClick={refreshFeed}
            className="fixed top-16 z-50 mt-2 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg transition cursor-pointer"
          >
            <ArrowUp size={17} />
            New posts available
          </button>
        </div>
      )}

      {/* Feed List */}
      <div className="flex flex-col">
        {isLoading && posts.length === 0 && <PostSkeletonList />}

        <VirtualPostList
          posts={posts as Feed[]}
          dropdownItems={dropdownItems}
          onZoom={setZoomData}
        />

        {/* Trigger infinite scroll */}
        <InfiniteScrollFooter
          refCallback={ref}
          isFetchingNextPage={isFetchingNextPage}
          hasNextPage={hasNextPage}
          hasItems={posts.length > 0}
        />
      </div>

      <ImageZoomDialog
        zoomData={zoomData}
        onClose={handleCloseZoom}
        onChangeIndex={handleChangeZoomIndex}
      />
    </>
  );
}
