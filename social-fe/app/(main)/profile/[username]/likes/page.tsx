"use client";

import VirtualPostList from "@/app/components/virtual-post-list";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useUserPosts } from "@/app/hooks/use-post";
import { Feed } from "@/app/interfaces/feed.interface";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
} from "@/app/components/skeletons";
import { useParams } from "next/navigation";

export default function LikesPage() {
  const { username } = useParams<{ username: string }>();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useUserPosts(username, "likes");

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
        <p className="text-gray-900 font-bold mb-2">
          You haven't liked any posts yet
        </p>
        <p className="text-gray-500 text-sm text-center">
          Explore posts and tap the heart icon to save your favorites.
        </p>
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
