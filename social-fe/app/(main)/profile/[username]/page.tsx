"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useProfile } from "@/app/hooks/use-profile";
import { useUserPosts } from "@/app/hooks/use-post";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { Feed } from "@/app/interfaces/feed.interface";
import NewPostModal from "@/app/components/dialog/new-post-dialog";
import { Button } from "@/components/ui/button";
import { DropdownItem } from "@/app/interfaces/dropdown/dropdown.interface";
import VirtualPostList from "@/app/components/virtual-post-list";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
} from "@/app/components/skeletons";
import {
  SquarePen,
  BookA,
  Copy,
  Funnel,
  Pin,
  Settings,
  VolumeOff,
} from "lucide-react";

const dropdownItems: DropdownItem[] = [
  { id: 1, title: "Pin to your profile", icon: <Pin size={18} /> },
  { id: 2, title: "Translate", icon: <BookA size={18} /> },
  { id: 3, title: "Copy post text", icon: <Copy size={18} /> },
  { id: 4, title: "Mute thread", icon: <VolumeOff size={18} /> },
  { id: 5, title: "Mute words & tags", icon: <Funnel size={18} /> },
  { id: 6, title: "Edit interaction settings", icon: <Settings size={18} /> },
];

export default function PostsPage() {
  const { username } = useParams<{ username: string }>();
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
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
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        <SquarePen
          className="mb-4 h-10 w-10 text-gray-500 sm:h-12 sm:w-12"
          strokeWidth={1}
        />

        <p className="mb-4 text-center text-base font-bold text-gray-900 sm:text-lg">
          No posts yet
        </p>

        {profile?.isOwner && (
          <div className="w-full max-w-xs sm:max-w-56">
            <Button
              type="button"
              onClick={() => setIsNewPostOpen(true)}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#0066FF] text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 sm:h-10 md:h-11"
            >
              <SquarePen className="h-4 w-4 shrink-0" />
              <span className="truncate">Write a post</span>
            </Button>

            <NewPostModal
              open={isNewPostOpen}
              onOpenChange={setIsNewPostOpen}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {isPostLoading && posts.length === 0 && <PostSkeletonList />}

        <VirtualPostList posts={posts as Feed[]} dropdownItems={dropdownItems} />
      </div>

      <InfiniteScrollFooter
        refCallback={ref}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={posts.length > 0}
      />
    </>
  );
}
