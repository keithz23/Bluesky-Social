"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  BadgeCheck,
  ArrowLeft,
  UserRoundSearch,
  FileSearch,
} from "lucide-react";
import { useSearchUsers } from "@/app/hooks/use-user";
import { useDebounce } from "@/app/hooks/use-debounce";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useSearchPosts } from "@/app/hooks/use-post";
import { FollowButton } from "@/app/components/button/follow-button";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
  UserListSkeleton,
} from "@/app/components/skeletons";
import VirtualPostList from "@/app/components/virtual-post-list";
import ImageZoomDialog, {
  ZoomData,
} from "@/app/components/dialog/image-zoom-dialog";
import { Feed } from "@/app/interfaces/feed.interface";

type SearchTab = "people" | "posts";

const TABS: Array<{ label: string; value: SearchTab }> = [
  { label: "People", value: "people" },
  { label: "Posts", value: "posts" },
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const initialTab = searchParams.get("tab") === "posts" ? "posts" : "people";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>(initialTab);
  const [zoomData, setZoomData] = useState<ZoomData | null>(null);

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebounce(trimmedQuery, 350);
  const { data: users = [], isFetching: isFetchingUsers } = useSearchUsers(
    activeTab === "people" ? trimmedQuery : "",
    20,
  );
  const {
    data: postPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingPosts,
  } = useSearchPosts(activeTab === "posts" ? debouncedQuery : "");

  const posts = useMemo(
    () => postPages?.pages.flatMap((page) => page.posts) ?? [],
    [postPages],
  );

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: activeTab === "posts" && posts.length > 0,
  });

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    const nextTab = searchParams.get("tab") === "posts" ? "posts" : "people";
    setQuery(nextQuery);
    setActiveTab(nextTab);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (trimmedQuery) params.set("q", trimmedQuery);
    params.set("tab", activeTab);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [activeTab, router, trimmedQuery]);

  const isEmptyQuery = trimmedQuery.length === 0;
  const showPeopleLoading =
    activeTab === "people" && trimmedQuery && isFetchingUsers && users.length === 0;
  const showPostsLoading =
    activeTab === "posts" &&
    debouncedQuery &&
    isLoadingPosts &&
    posts.length === 0;

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20 lg:min-h-[calc(100dvh-3.5rem)]">
      <div className="sticky top-14 z-20 border-b border-gray-100 bg-white/90 backdrop-blur-md lg:top-14">
        <div className="flex items-center gap-3 p-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-2 transition hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </button>

          <div className="group relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, posts, or hashtags"
              className="w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        <div className="flex border-t border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={`relative flex-1 py-3 text-[15px] font-bold transition hover:bg-gray-50 ${
                activeTab === tab.value ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {tab.label}
              {activeTab === tab.value && (
                <span className="absolute bottom-0 left-1/2 h-1 w-16 -translate-x-1/2 rounded-t-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {isEmptyQuery && <EmptySearchState activeTab={activeTab} />}

      {showPeopleLoading && <UserListSkeleton />}
      {showPostsLoading && <PostSkeletonList />}

      {!isEmptyQuery && activeTab === "people" && !isFetchingUsers && users.length === 0 && (
        <NoResultsState activeTab="people" />
      )}

      {!isEmptyQuery &&
        activeTab === "posts" &&
        !isLoadingPosts &&
        posts.length === 0 && <NoResultsState activeTab="posts" />}

      {activeTab === "people" && users.length > 0 && (
        <div className="flex flex-col">
          {users.map((user: any) => (
            <div
              key={user.id}
              onClick={() => router.push(`/profile/${user.username}`)}
              className="flex cursor-pointer items-start gap-3 border-b border-gray-100 p-4 transition hover:bg-gray-50"
            >
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#FF4F5A] text-white">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate font-bold text-gray-900">
                    {user.displayName}
                  </span>
                  {user.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                  )}
                </div>
                <p className="truncate text-sm text-gray-500">
                  @{user.username}
                </p>
                {user.bio && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-800">
                    {user.bio}
                  </p>
                )}
              </div>

              <div onClick={(event) => event.stopPropagation()}>
                <FollowButton targetUserId={user.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "posts" && posts.length > 0 && (
        <>
          <VirtualPostList
            posts={posts as Feed[]}
            dropdownItems={[]}
            onZoom={setZoomData}
          />
          <InfiniteScrollFooter
            refCallback={ref}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            hasItems={posts.length > 0}
          />
        </>
      )}

      <ImageZoomDialog
        zoomData={zoomData}
        onClose={() => setZoomData(null)}
        onChangeIndex={(index) =>
          setZoomData((current) =>
            current ? { ...current, currentIndex: index } : null,
          )
        }
      />
    </div>
  );
}

function EmptySearchState({ activeTab }: { activeTab: SearchTab }) {
  const Icon = activeTab === "people" ? UserRoundSearch : FileSearch;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Icon className="mb-4 h-12 w-12 text-gray-300" strokeWidth={1.5} />
      <p className="text-[15px] font-medium text-gray-500">
        {activeTab === "people"
          ? "Search for people by username or display name."
          : "Search posts by text or hashtag."}
      </p>
    </div>
  );
}

function NoResultsState({ activeTab }: { activeTab: SearchTab }) {
  const Icon = activeTab === "people" ? UserRoundSearch : FileSearch;

  return (
    <div className="flex flex-col items-center justify-center px-6 pt-28 text-center">
      <Icon className="mb-4 h-12 w-12 text-gray-300" strokeWidth={1.5} />
      <p className="text-[15px] font-semibold text-gray-900">
        No {activeTab} found
      </p>
      <p className="mt-1 text-sm text-gray-500">
        Try another keyword or hashtag.
      </p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<UserListSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
