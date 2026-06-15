"use client";

import { useParams } from "next/navigation";
import { useUserPosts } from "@/app/hooks/use-post";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import VirtualPostList from "@/app/components/virtual-post-list";
import { Feed } from "@/app/interfaces/feed.interface";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
} from "@/app/components/skeletons";
import { SquarePen } from "lucide-react";

export default function MediaPage() {
  const { username } = useParams<{ username: string }>();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useUserPosts(username, "media");

  const posts =
    data?.pages.flatMap((page) => page.posts)?.filter(Boolean) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: posts.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <PostSkeletonList />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 px-4">
        <SquarePen className="w-12 h-12 text-gray-600 mb-4" strokeWidth={1} />
        <p className="text-gray-900 font-bold mb-4">No media posts yet</p>
      </div>
    );
  }

  return (
    <>
      <VirtualPostList posts={posts as Feed[]} dropdownItems={[]} />

      <InfiniteScrollFooter
        refCallback={ref}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={posts.length > 0}
      />
    </>
  );
}
