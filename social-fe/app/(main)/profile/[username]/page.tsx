"use client";

import { useParams } from "next/navigation";
import { useProfile } from "@/app/hooks/use-profile";
import { useUserPosts } from "@/app/hooks/use-post";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { Feed } from "@/app/interfaces/feed.interface";
import NewPostModal from "@/app/components/dialog/new-post-dialog";
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
