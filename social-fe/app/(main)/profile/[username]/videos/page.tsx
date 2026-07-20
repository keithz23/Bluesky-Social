"use client";

import { useParams } from "next/navigation";
import { Film } from "lucide-react";
import VirtualPostList from "@/app/components/virtual-post-list";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
} from "@/app/components/skeletons";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useUserPosts } from "@/app/hooks/use-post";
import { Feed } from "@/app/interfaces/feed.interface";
import PrivateProfileState from "@/app/components/private-profile-state";
import { useProfile } from "@/app/hooks/use-profile";
import { isProfilePrivateLocked } from "@/app/utils/profile-privacy.util";

export default function VideosPage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile } = useProfile(username);
  const privateLocked = isProfilePrivateLocked(profile);
  const canLoadProfileContent = Boolean(profile) && !privateLocked;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useUserPosts(username, "videos", { enabled: canLoadProfileContent });

  const posts =
    data?.pages.flatMap((page) => page.posts)?.filter(Boolean) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: posts.length > 0,
  });

  if (isLoading) {
    return <PostSkeletonList />;
  }

  if (privateLocked) {
    return <PrivateProfileState />;
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
        <Film className="mb-4 h-12 w-12 text-gray-400" strokeWidth={1.5} />
        <p className="font-bold text-gray-900">No videos yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Video posts from this account will appear here.
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
