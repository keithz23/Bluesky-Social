"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFeedCatalog, useSystemFeed } from "@/app/hooks/use-feed-catalog";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import VirtualPostList from "@/app/components/virtual-post-list";
import { dropdownItems } from "@/app/constants/dropdown.constant";
import { InfiniteScrollFooter, PostSkeletonList } from "@/app/components/skeletons";

export default function SystemFeedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: catalog = [] } = useFeedCatalog();
  const feed = catalog.find((item) => item.slug === slug);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useSystemFeed(slug);
  const posts = useMemo(() => data?.pages.flatMap((page) => page.posts) ?? [], [data]);
  const { ref } = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, enabled: posts.length > 0 });

  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-14 z-20 flex items-center gap-3 border-b bg-white/90 p-4 backdrop-blur-md">
        <Link href="/feeds" aria-label="Back to feeds" className="rounded-full p-2 hover:bg-gray-100"><ArrowLeft className="size-5" /></Link>
        <div><h1 className="font-bold">{feed?.name ?? "Feed"}</h1><p className="text-xs text-gray-500">{feed?.description}</p></div>
      </header>
      {isLoading && <PostSkeletonList />}
      {isError && <p className="p-8 text-center text-gray-500">Could not load this feed.</p>}
      {!isLoading && !isError && posts.length === 0 && <p className="p-8 text-center text-gray-500">No posts in this feed yet.</p>}
      <VirtualPostList posts={posts} dropdownItems={dropdownItems} />
      <InfiniteScrollFooter refCallback={ref} isFetchingNextPage={isFetchingNextPage} hasNextPage={hasNextPage} hasItems={posts.length > 0} />
    </div>
  );
}
