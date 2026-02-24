"use client";

import PostCard from "@/app/components/card/post-card";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useUserPosts } from "@/app/hooks/use-post";
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
        {Array.from({ length: 5 }).map((_, i) => (
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
      <div className="flex flex-col">
        {posts.map((post) => (
          <PostCard post={post} key={post.id} />
        ))}
      </div>

      <div ref={ref} className="py-4 text-center text-sm text-gray-400">
        {isFetchingNextPage
          ? "Loading more..."
          : !hasNextPage && posts.length > 0
            ? "You're all caught up"
            : null}
      </div>
    </>
  );
}
