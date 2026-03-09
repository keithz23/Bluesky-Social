"use client";

import Avatar from "@/app/components/avatar";
import { FollowButton } from "@/app/components/button/follow-button";
import { useAuth } from "@/app/hooks/use-auth";
import { useGetFollowingLists } from "@/app/hooks/use-follow";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useProfile } from "@/app/hooks/use-profile";
import { ArrowLeft, BadgeCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function FollowsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const { data: profile } = useProfile(username);
  const isOwnProfile = user?.username === username;

  const { data, fetchNextPage, isFetchingNextPage, isLoading, hasNextPage } =
    useGetFollowingLists(username);

  const following = data?.pages.flatMap((page) => page.following) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    enabled: following?.length > 0,
  });

  return (
    <>
      <div className="flex flex-col w-full bg-white pb-20 min-h-screen">
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center p-2">
          <button
            onClick={() => {
              router.back();
            }}
            className="p-2 mr-4 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-900">
              {profile?.username}
            </h1>
            <p className="text-sm text-gray-500">
              {profile?.followingCount ?? 0} following
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {/* --- SKELETON LOADING --- */}
          {!isLoading &&
            following.length === 0 &&
            (isOwnProfile ? (
              <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                {/* Icon */}
                <div className="text-slate-500 mb-4">
                  <UserX className="w-16 h-16 stroke-[1.5]" />
                </div>

                {/* Text */}
                <h2 className="text-[20px] font-semibold text-slate-700 mb-6">
                  You are not following anyone yet
                </h2>

                {/* Button */}
                <Link
                  href="/explore"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full transition text-[15px]"
                >
                  See suggested accounts
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
                <h2 className="text-[20px] font-semibold text-slate-700">
                  @{username} isn't following anyone yet
                </h2>
                <p className="text-slate-500 mt-2 text-[15px]">
                  When they do, those accounts will show up here.
                </p>
              </div>
            ))}

          {/* --- RENDER LIST --- */}
          {following.map((fl) => (
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

                {/* Follow button */}
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
              : !hasNextPage && following.length > 0
                ? ""
                : null}
          </div>
        </div>
      </div>
    </>
  );
}
