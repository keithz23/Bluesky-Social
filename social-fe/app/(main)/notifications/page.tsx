"use client";
import Avatar from "@/app/components/avatar";
import {
  useGetNotifications,
  useNotifications,
} from "@/app/hooks/use-notifications";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { Notifications } from "@/app/interfaces/notification.interface";
import { Settings, Bell, BadgeCheck, Circle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TABS = [
  { label: "All", value: "all" },
  { label: "Mentions", value: "mention" },
] as const;

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "mention">("all");
  const { markAsRead, markAllAsRead } = useNotifications();
  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isLoading } =
    useGetNotifications(filter);

  const notifications =
    data?.pages.flatMap((page) => page?.notifications || []) || [];
  const isEmpty = notifications.length === 0 && !isLoading;

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

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-full transition cursor-pointer"
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
      {isLoading && (
        <div className="flex justify-center mt-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

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
          {notifications.map((noti: Notifications) => (
            <div
              key={noti.id}
              onClick={() => {
                if (!noti.isRead) markAsRead(noti.id);
              }}
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
          <div ref={ref} className="py-4 text-center text-sm text-gray-400">
            {isFetchingNextPage ? "Loading more..." : null}
          </div>
        </div>
      )}
    </div>
  );
}
