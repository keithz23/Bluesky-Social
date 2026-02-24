"use client";

import Avatar from "@/app/components/avatar";
import { FollowButton } from "@/app/components/button/follow-button";
import { useAuth } from "@/app/hooks/use-auth";
import { useGetFollowerLists } from "@/app/hooks/use-follow";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useProfile } from "@/app/hooks/use-profile";
import { ArrowLeft, BadgeCheck, UserRoundX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function FollowersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const { data: profile } = useProfile(username);
  const isOwnProfile = user?.username === username;

  const { data, fetchNextPage, isFetchingNextPage, isLoading, hasNextPage } =
    useGetFollowerLists(username);

  const follower = data?.pages.flatMap((page) => page.follower) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    enabled: follower?.length > 0,
  });

  return (
    <>
      <div className="flex flex-col w-full bg-white pb-20 min-h-screen">
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center p-2">
          <button
            onClick={() => router.back()}
            className="p-2 mr-4 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-900">
              {profile?.username}
            </h1>
            <p className="text-sm text-gray-500">
              {profile?.followersCount ?? 0} followers
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {/* --- SKELETON LOADING --- */}
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="p-4 border-b border-gray-100 animate-pulse flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex flex-col gap-2">
                      <div className="h-4 bg-gray-200 rounded w-24" />
                      <div className="h-3 bg-gray-200 rounded w-16" />
                    </div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-full" />
                </div>
                <div className="ml-15 flex flex-col gap-2">
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}

          {/* --- EMPTY STATE --- */}
          {!isLoading && follower.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
              <div className="text-slate-500 mb-4">
                <UserRoundX className="w-16 h-16 stroke-[1.5]" />
              </div>
              <h2 className="text-[20px] font-semibold text-slate-700 mb-2">
                {isOwnProfile
                  ? "You don't have any followers yet"
                  : `@${username} doesn't have any followers`}
              </h2>
              <p className="text-slate-500 mb-6 text-[15px]">
                {isOwnProfile
                  ? "When someone follows you, you'll see them here."
                  : "When someone follows them, they'll show up here."}
              </p>
            </div>
          )}

          {/* --- RENDER LIST --- */}
          {follower.map((fl) => (
            <div
              className="p-4 border-b border-gray-100 hover:bg-gray-50 transition"
              key={fl.id}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-x-3">
                  {/* Avatar */}
                  <Avatar data={fl} />

                  {/* User info */}
                  <div className="flex flex-col">
                    <Link
                      href={`/profile/${fl.username}`}
                      className="flex items-center gap-x-1 group"
                    >
                      <p className="font-bold text-[15px] text-gray-900 group-hover:underline">
                        {fl.username}
                      </p>
                      {fl.verified && (
                        <BadgeCheck className="w-4 h-4 fill-blue-500 text-white" />
                      )}
                    </Link>
                    <p className="text-gray-500 text-[15px]">@{fl.username}</p>
                  </div>
                </div>

                {fl.id !== user?.id && (
                  <div className="shrink-0 ml-2">
                    <FollowButton targetUserId={fl.id} />
                  </div>
                )}
              </div>

              {fl.bio && (
                <p className="mt-1 ml-15 text-[15px] text-gray-900 whitespace-pre-wrap">
                  {fl.bio}
                </p>
              )}
            </div>
          ))}

          {/* Trigger infinite scroll */}
          <div ref={ref} className="py-6 text-center text-[15px] text-gray-500">
            {isFetchingNextPage
              ? "Loading more..."
              : !hasNextPage && follower.length > 0
                ? ""
                : null}
          </div>
        </div>
      </div>
    </>
  );
}
