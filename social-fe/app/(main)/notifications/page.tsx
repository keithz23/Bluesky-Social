"use client";
import Avatar from "@/app/components/avatar";
import {
  useGetNotifications,
  useNotifications,
} from "@/app/hooks/use-notifications";
import {
  ReceivedFollowRequest,
  useFollowRequestActions,
  useReceivedFollowRequests,
} from "@/app/hooks/use-follow";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import {
  InfiniteScrollFooter,
  NotificationSkeleton,
} from "@/app/components/skeletons";
import { Notifications } from "@/app/interfaces/notification.interface";
import { extractErrMsg } from "@/app/utils/error.util";
import {
  Settings,
  Bell,
  BadgeCheck,
  Circle,
  Check,
  Loader2,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const TABS = [
  { label: "All", value: "all" },
  { label: "Mentions", value: "mention" },
] as const;

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "mention">("all");
  const [actionRequestId, setActionRequestId] = useState<string | null>(null);
  const { unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isLoading } =
    useGetNotifications(filter);
  const {
    data: followRequestsData,
    fetchNextPage: fetchNextFollowRequests,
    isFetchingNextPage: isFetchingNextFollowRequests,
    hasNextPage: hasNextFollowRequestsPage,
    isLoading: isFollowRequestsLoading,
  } = useReceivedFollowRequests({ enabled: filter === "all" });
  const { accept, decline } = useFollowRequestActions();

  const allNotifications =
    data?.pages.flatMap((page) => page?.notifications || []) || [];
  const notifications =
    filter === "all"
      ? allNotifications.filter((noti) => noti.type !== "FOLLOW_REQUEST")
      : allNotifications;
  const followRequests =
    filter === "all"
      ? followRequestsData?.pages.flatMap((page) => page?.receivedFollow || [])
      : [];
  const hasFollowRequests = Boolean(followRequests?.length);
  const isRequestLoading = filter === "all" && isFollowRequestsLoading;
  const isEmpty =
    notifications.length === 0 &&
    !hasFollowRequests &&
    !isLoading &&
    !isRequestLoading;

  const { ref } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    enabled: notifications.length > 0,
  });

  const handleProfileClick = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    router.push(`/profile/${username}`);
  };

  const handleNotificationClick = (noti: Notifications) => {
    if (!noti.isRead) markAsRead(noti.id);

    if (noti.postId && noti.post?.user?.username) {
      router.push(`/profile/${noti.post.user.username}/post/${noti.postId}`);
      return;
    }

    if (noti.actor?.username) {
      router.push(`/profile/${noti.actor.username}`);
    }
  };

  const handleAcceptRequest = async (
    e: React.MouseEvent,
    request: ReceivedFollowRequest,
  ) => {
    e.stopPropagation();
    setActionRequestId(request.requestId);

    try {
      await accept.mutateAsync(request.id);
      toast.success("Follow request accepted");
    } catch (err) {
      toast.error(extractErrMsg(err));
    } finally {
      setActionRequestId(null);
    }
  };

  const handleDeclineRequest = async (
    e: React.MouseEvent,
    request: ReceivedFollowRequest,
  ) => {
    e.stopPropagation();
    setActionRequestId(request.requestId);

    try {
      await decline.mutateAsync(request.id);
      toast.success("Follow request declined");
    } catch (err) {
      toast.error(extractErrMsg(err));
    } finally {
      setActionRequestId(null);
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20 lg:min-h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-md lg:top-14">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
            >
              Mark all read
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex w-full border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-1 pb-3 pt-1 text-[15px] font-bold transition cursor-pointer border-b-[3px] ${
                filter === tab.value
                  ? "text-gray-900 border-blue-600"
                  : "text-gray-500 border-transparent hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {(isLoading || isRequestLoading) && <NotificationSkeleton />}

      {/* Empty */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center mt-32 px-4">
          <Bell className="w-10 h-10 text-gray-400 mb-4" strokeWidth={1.5} />
          <p className="text-gray-500 text-[15px] font-medium">
            No notifications yet
          </p>
        </div>
      )}

      {/* List */}
      {!isEmpty && (
        <div className="flex flex-col w-full">
          {filter === "all" && hasFollowRequests && (
            <div className="border-b border-gray-100">
              <div className="flex items-center gap-2 px-4 pb-2 pt-3 text-sm font-bold text-gray-900">
                <UserPlus className="size-4 text-blue-600" />
                Follow requests
              </div>

              {followRequests?.map((request) => {
                const isActing =
                  actionRequestId === request.requestId &&
                  (accept.isPending || decline.isPending);

                return (
                  <div
                    key={request.requestId}
                    onClick={() => router.push(`/profile/${request.username}`)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-gray-50"
                  >
                    <div className="pt-1">
                      <Avatar data={request} />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="text-[15px] leading-snug text-gray-900">
                          <span
                            className="inline-flex cursor-pointer items-center gap-1 font-bold hover:underline"
                            onClick={(e) =>
                              handleProfileClick(e, request.username)
                            }
                          >
                            {request.displayName}
                            {request.verified && (
                              <BadgeCheck className="h-4 w-4 fill-blue-500 text-white" />
                            )}
                          </span>
                          <span className="ml-1 text-gray-600">
                            requested to follow you.
                          </span>
                        </div>
                        <span className="mt-1 block text-sm text-gray-500">
                          @{request.username}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleAcceptRequest(e, request)}
                          disabled={isActing}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isActing ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeclineRequest(e, request)}
                          disabled={isActing}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-gray-300 px-4 text-sm font-bold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <X className="size-4" />
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasNextFollowRequestsPage && (
                <button
                  type="button"
                  onClick={() => fetchNextFollowRequests()}
                  disabled={isFetchingNextFollowRequests}
                  className="flex w-full items-center justify-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-bold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                >
                  {isFetchingNextFollowRequests && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Show more requests
                </button>
              )}
            </div>
          )}

          {notifications.map((noti: Notifications) => (
            <div
              key={noti.id}
              onClick={() => handleNotificationClick(noti)}
              className={`flex gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 ${
                !noti.isRead ? "bg-blue-50/40" : "bg-white"
              }`}
            >
              <div className="pt-1">
                <Avatar data={noti?.actor} />
              </div>

              <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="text-[15px] text-gray-900 leading-snug">
                  <span
                    className="font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    onClick={(e) => handleProfileClick(e, noti.actor.username)}
                  >
                    {noti.actor?.displayName}
                    {noti.actor?.verified && (
                      <BadgeCheck className="w-4 h-4 fill-blue-500 text-white" />
                    )}
                  </span>
                  <span className="text-gray-600 ml-1">
                    {noti.type === "LIKE" && "liked your post."}
                    {noti.type === "COMMENT" && "commented on your post."}
                    {noti.type === "FOLLOW" && "started following you."}
                    {noti.type === "MENTION" && "mentioned you in a post."}
                    {noti.type === "REPOST" && "reposted your post."}
                    {noti.type === "REPLY" && "replied to your post."}
                    {noti.type === "FOLLOW_REQUEST" &&
                      "requested to follow you."}
                    {noti.type === "FOLLOW_REQUEST_ACCEPTED" &&
                      "accepted your follow request."}
                  </span>
                </div>
                <span className="text-sm text-gray-500 mt-1">
                  {new Date(noti.createdAt).toLocaleDateString()}
                </span>
              </div>

              {!noti.isRead && (
                <div className="flex items-center pl-2">
                  <Circle className="w-2.5 h-2.5 fill-blue-600 text-blue-600" />
                </div>
              )}
            </div>
          ))}

          {/* Infinite scroll trigger */}
          <InfiniteScrollFooter
            refCallback={ref}
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            hasItems={notifications.length > 0}
          />
        </div>
      )}
    </div>
  );
}
