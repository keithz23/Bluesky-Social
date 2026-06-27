"use client";

import { useMemo, useCallback } from "react";
import { useFeed } from "@/app/hooks/use-feed";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { Feed } from "../interfaces/feed.interface";
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
      {hasNewPosts && (
        <div className="flex justify-center">
          <button
            onClick={refreshFeed}
            className="fixed top-30 z-30 mt-2 flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-blue-600 cursor-pointer lg:top-16"
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
