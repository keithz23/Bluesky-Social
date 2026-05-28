"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BadgeCheck, ArrowLeft, UserRoundSearch } from "lucide-react";
import { useSearchUsers } from "@/app/hooks/use-user";
import { FollowButton } from "@/app/components/button/follow-button";
import { UserListSkeleton } from "@/app/components/skeletons";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const { data: users = [], isFetching } = useSearchUsers(trimmedQuery, 20);

  return (
    <div className="flex min-h-screen w-full flex-col bg-white pb-20">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 p-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
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
              placeholder="Search people"
              className="w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>
      </div>

      {!trimmedQuery && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <UserRoundSearch
            className="mb-4 h-12 w-12 text-gray-300"
            strokeWidth={1.5}
          />
          <p className="text-[15px] font-medium text-gray-500">
            Search for people by username or display name.
          </p>
        </div>
      )}

      {trimmedQuery && isFetching && users.length === 0 && <UserListSkeleton />}

      {trimmedQuery && !isFetching && users.length === 0 && (
        <div className="flex flex-col items-center justify-center px-6 pt-28 text-center">
          <UserRoundSearch
            className="mb-4 h-12 w-12 text-gray-300"
            strokeWidth={1.5}
          />
          <p className="text-[15px] font-semibold text-gray-900">
            No people found
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Try another username or display name.
          </p>
        </div>
      )}

      {users.length > 0 && (
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
    </div>
  );
}
