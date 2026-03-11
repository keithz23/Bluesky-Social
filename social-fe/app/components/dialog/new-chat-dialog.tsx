"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, BadgeCheck } from "lucide-react";
import { useAuth } from "@/app/hooks/use-auth";
import { useGetFollowingLists } from "@/app/hooks/use-follow";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import Avatar from "../avatar";
import { useSearchUsers } from "@/app/hooks/use-user";
import { User } from "@/app/interfaces/user.interface";
import { ChatService } from "@/app/services/chat.service";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function NewChatDialog() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch search results when typing
  const { data: searchResults, isFetching: isSearching } = useSearchUsers(
    searchQuery,
    10,
  );

  const { data, fetchNextPage, isFetchingNextPage, isLoading, hasNextPage } =
    useGetFollowingLists(user.username);

  const following = data?.pages.flatMap((page) => page.following) ?? [];

  const hasQuery = searchQuery.trim().length > 0;
  const displayUsers = hasQuery ? (searchResults ?? []) : following;

  const { ref } = useInfiniteScroll({
    hasNextPage: !hasQuery && hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    enabled: !hasQuery && following?.length > 0,
  });

  const handleStartChat = async (targetUser: User) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const conversation = await ChatService.createConversation({
        type: "DIRECT",
        participantIds: [targetUser.id],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setOpen(false);
      setSearchQuery("");
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-haspopup="dialog"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] px-4 py-1.5 rounded-full transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            New chat
          </button>
        </DialogTrigger>
        <DialogContent className="p-0 gap-0 sm:max-w-106.25 overflow-hidden">
          <DialogHeader className="p-4 pb-3 border-b border-gray-200 space-y-3">
            <DialogTitle className="text-left text-lg font-bold text-slate-900">
              Start a new chat
            </DialogTitle>
            <div className="flex items-center gap-2.5">
              <Search className="h-4.5 w-4.5 text-blue-600" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="Search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-[15px] placeholder:text-gray-500 text-slate-900 focus:outline-none focus:ring-0 p-0"
              />
            </div>
          </DialogHeader>

          <div className="flex flex-col py-2 max-h-87.5 overflow-y-auto">
            {/* Loading state during search */}
            {hasQuery && isSearching && (
              <p className="p-4 text-center text-gray-500 text-sm">
                Searching...
              </p>
            )}

            {/* Empty state for search results */}
            {hasQuery && !isSearching && displayUsers.length === 0 && (
              <p className="p-4 text-center text-gray-500 text-sm">
                No users found.
              </p>
            )}

            {/* Empty state for following list (optional) */}
            {!hasQuery && !isLoading && displayUsers.length === 0 && (
              <p className="p-4 text-center text-gray-500 text-sm">
                You aren't following anyone yet.
              </p>
            )}

            {!isSearching &&
              displayUsers.map((u: User) => (
                <button
                  className="w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left cursor-pointer"
                  key={u.id}
                  ref={!hasQuery ? ref : undefined}
                  onClick={() => handleStartChat(u)}
                  disabled={isCreating}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-x-3">
                      {/* Avatar */}
                      <Avatar data={u} />

                      {/* User info */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-x-1">
                          <p className="font-bold text-[15px] text-gray-900">
                            {u.displayName}
                          </p>
                          {u.verified && (
                            <BadgeCheck className="w-4 h-4 fill-blue-500 text-white" />
                          )}
                        </div>
                        <p className="text-gray-500 text-[15px]">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

            {/* Loading state for infinite scroll */}
            {!hasQuery && isFetchingNextPage && (
              <p className="p-4 text-center text-gray-500 text-sm">
                Loading more...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
