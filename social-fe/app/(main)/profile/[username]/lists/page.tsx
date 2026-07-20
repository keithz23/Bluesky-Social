"use client";

import { useParams } from "next/navigation";
import { ListChecks } from "lucide-react";
import ListItem from "@/app/components/list-item";
import { InfiniteScrollFooter, ListSkeleton } from "@/app/components/skeletons";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useGetlists } from "@/app/hooks/use-list";
import PrivateProfileState from "@/app/components/private-profile-state";
import { useProfile } from "@/app/hooks/use-profile";
import { isProfilePrivateLocked } from "@/app/utils/profile-privacy.util";

export default function ListsPage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile } = useProfile(username);
  const privateLocked = isProfilePrivateLocked(profile);
  const canLoadProfileContent = Boolean(profile) && !privateLocked;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetlists(username, { enabled: canLoadProfileContent });

  const lists = data?.pages.flatMap((page) => page.lists) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: lists.length > 0,
  });

  if (isLoading) return <ListSkeleton />;

  if (privateLocked) {
    return <PrivateProfileState />;
  }

  if (lists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
        <ListChecks
          className="mb-4 h-12 w-12 text-gray-400"
          strokeWidth={1.5}
        />
        <p className="font-bold text-gray-900">No lists yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Lists created by this account will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {lists.map((list) => (
          <ListItem item={list} key={list.id} />
        ))}
      </div>

      <InfiniteScrollFooter
        refCallback={ref}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={lists.length > 0}
      />
    </>
  );
}
