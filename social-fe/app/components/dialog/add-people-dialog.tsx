"use client";

import React, { useState } from "react";
import { Search, X, UserPlus, Loader2, BadgeCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSearchUsers } from "@/app/hooks/use-user";
import { useGetFollowingLists } from "@/app/hooks/use-follow";
import { useAuth } from "@/app/hooks/use-auth";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { User } from "@/app/interfaces/user.interface";
import Avatar from "../avatar";
import { useListMember } from "@/app/hooks/use-list-member";

interface AddPeopleDialogProps {
  children?: React.ReactNode;
  listId: string;
  currentMembers?: ListMember[];
}

type ListMember = {
  user: User;
};

type ListCandidateUser = User & {
  isAdded?: boolean;
};

export default function AddPeopleDialog({
  children,
  listId,
  currentMembers = [],
}: AddPeopleDialogProps) {
  const { user } = useAuth();
  const username = user?.username ?? "";
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberOverrides, setMemberOverrides] = useState<
    Record<string, boolean>
  >({});

  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const { mutationAdd, mutationRemove } = useListMember();

  const { data: searchResults, isFetching: isSearching } = useSearchUsers(
    searchQuery,
    10,
    listId,
  );

  const { data, fetchNextPage, isFetchingNextPage, isLoading, hasNextPage } =
    useGetFollowingLists(username, listId);

  const following = data?.pages.flatMap((page) => page.following) ?? [];
  const hasQuery = searchQuery.trim().length > 0;
  const displayUsers = hasQuery ? (searchResults ?? []) : following;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
      setMemberOverrides({});
      setLoadingUserId(null);
    }
  };

  const { ref } = useInfiniteScroll({
    hasNextPage: !hasQuery && hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    enabled: !hasQuery && following?.length > 0,
  });

  const toggleUserListStatus = (
    targetUserId: string,
    isCurrentlyAdded: boolean,
  ) => {
    if (loadingUserId) return;

    setLoadingUserId(targetUserId);

    if (isCurrentlyAdded) {
      mutationRemove.mutate(
        { listId, userIdToRemove: targetUserId },
        {
          onSuccess: () => {
            setMemberOverrides((prev) => ({
              ...prev,
              [targetUserId]: false,
            }));
          },
          onSettled: () => setLoadingUserId(null),
        },
      );
    } else {
      mutationAdd.mutate(
        { listId, userIdToAdd: targetUserId },
        {
          onSuccess: () => {
            setMemberOverrides((prev) => ({
              ...prev,
              [targetUserId]: true,
            }));
          },
          onSettled: () => setLoadingUserId(null),
        },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="h-11 px-6 rounded-full bg-[#1185fe] hover:bg-[#0a70db] text-white font-bold text-[15px] flex items-center gap-2 shadow-none transition-colors cursor-pointer">
            <UserPlus className="w-4.5 h-4.5" strokeWidth={2.5} />
            Start adding people!
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 overflow-hidden sm:max-w-125 w-full h-[80vh] max-h-150 rounded-2xl flex flex-col [&>button]:hidden bg-white">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <DialogTitle className="text-xl font-bold text-gray-900">
            Add people to list
          </DialogTitle>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="p-1.5 -mr-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="flex items-center gap-3 px-5 pb-3 border-b border-gray-100">
          <Search className="w-5 h-5 text-[#1185fe]" strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[16px] text-gray-900 placeholder-gray-500 outline-none"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {(isLoading && !hasQuery) ||
          (isSearching && displayUsers.length === 0) ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 text-[#1185fe] animate-spin" />
            </div>
          ) : null}

          <div className="flex flex-col">
            {displayUsers.map((user: ListCandidateUser) => {
              const isAdded =
                memberOverrides[user.id] ??
                user.isAdded ??
                currentMembers.some((member) => member.user.id === user.id);

              const isHandling = loadingUserId === user.id;

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar data={user} />

                    <div className="flex flex-col truncate">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px] text-gray-900 truncate">
                          {user.displayName || user.username}
                        </span>
                        {user.verified && (
                          <BadgeCheck className="w-4 h-4 text-[#1185fe] shrink-0" />
                        )}
                      </div>
                      <span className="text-[14px] text-gray-500 truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUserListStatus(user.id, isAdded);
                    }}
                    disabled={isHandling || Boolean(loadingUserId)}
                    className={`shrink-0 ml-3 min-w-20 h-8.5 flex items-center justify-center rounded-full text-[14px] font-semibold transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                      isAdded
                        ? "bg-[#F1F5F9] text-[#334155] hover:bg-[#e2e8f0]"
                        : "bg-[#1185fe] text-white hover:bg-blue-600"
                    }`}
                  >
                    {isHandling ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : isAdded ? (
                      "Remove"
                    ) : (
                      "Add"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {!hasQuery && hasNextPage && (
            <div ref={ref} className="h-14 flex items-center justify-center">
              {isFetchingNextPage && (
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>
          )}

          {!isLoading && displayUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-[15px]">
              {hasQuery
                ? "No users found."
                : "You aren't following anyone yet."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
