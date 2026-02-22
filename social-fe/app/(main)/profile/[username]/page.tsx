"use client";

import { useParams } from "next/navigation";
import { useProfile } from "@/app/hooks/use-profile";
import { useUserPosts } from "@/app/hooks/use-post";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import PostCard from "@/app/components/card/post-card";
import { Feed } from "@/app/interfaces/feed.interface";
import NewPostModal from "@/app/components/dialog/new-post-dialog";
import { SquarePen } from "lucide-react";

export default function PostsPage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile } = useProfile(username);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostLoading,
  } = useUserPosts(username, "posts");

  const posts =
    data?.pages.flatMap((page) => page.posts)?.filter(Boolean) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: posts.length > 0,
  });

  if (posts.length === 0 && !isPostLoading) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 px-4">
        <SquarePen className="w-12 h-12 text-gray-600 mb-4" strokeWidth={1} />
        <p className="text-gray-900 font-bold mb-4">No posts yet</p>
        {profile?.isOwner && (
          <div className="w-1/3">
            <NewPostModal buttonName="Write a post" />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {isPostLoading &&
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
