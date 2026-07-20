"use client";

import { useEffect } from "react";
import {
  InfiniteData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSocket } from "@/providers/socket.provider";
import { NotificationService } from "../services/notification.service";
import { infiniteQueryOptions } from "./infinite-query-options";
import { Notifications } from "../interfaces/notification.interface";

type NotificationFilter = "all" | "mention";
type NotificationsResponse = {
  notifications: Notifications[];
  nextCursor: string | null;
  hasMore: boolean;
};

const updateNotificationCaches = (
  qc: ReturnType<typeof useQueryClient>,
  updater: (notification: any) => any,
) => {
  qc.getQueriesData({ queryKey: ["notifications"] }).forEach(([queryKey]) => {
    qc.setQueryData(queryKey, (old: any) => {
      if (!old?.pages) return old;

      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          notifications: page.notifications.map(updater),
        })),
      };
    });
  });
};

export const useNotifications = (enabled = true) => {
  const { notificationsSocket, isConnected } = useSocket();
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: NotificationService.getUnreadCount,
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!enabled || !notificationsSocket || !isConnected) return;

    const handleUnreadCount = (data: { count: number }) => {
      qc.setQueryData(["notifications", "unread-count"], data.count);
    };

    const handleNewNotification = (newNoti: any) => {
      const addToCache = (filter: NotificationFilter) => {
        if (filter === "mention" && newNoti.type !== "MENTION") return;

        qc.setQueryData(["notifications", filter], (old: any) => {
          if (!old?.pages?.length) return old;

          const currentList = old.pages[0].notifications || [];
          const isDuplicate = currentList.some(
            (noti: any) => noti.id === newNoti.id,
          );

          if (isDuplicate) return old;

          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                notifications: [newNoti, ...currentList],
              },
              ...old.pages.slice(1),
            ],
          };
        });
      };

      addToCache("all");
      addToCache("mention");
    };

    const handleInitialNotifications = (payload: any) => {
      qc.setQueryData(["notifications", "all"], {
        pages: [payload],
        pageParams: [undefined],
      });
    };

    const handleConnect = () => {
      notificationsSocket.emit("get-notifications");
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    };

    notificationsSocket.on("unread-count", handleUnreadCount);
    notificationsSocket.on("new-notification", handleNewNotification);
    notificationsSocket.on("notifications:initial", handleInitialNotifications);
    notificationsSocket.on("connect", handleConnect);

    if (notificationsSocket.connected) {
      handleConnect();
    }

    return () => {
      notificationsSocket.off("unread-count", handleUnreadCount);
      notificationsSocket.off("new-notification", handleNewNotification);
      notificationsSocket.off(
        "notifications:initial",
        handleInitialNotifications,
      );
      notificationsSocket.off("connect", handleConnect);
    };
  }, [enabled, notificationsSocket, isConnected, qc]);

  const markAsRead = async (notificationId: string) => {
    const previousCount =
      qc.getQueryData<number>(["notifications", "unread-count"]) ?? 0;
    let wasUnread = false;

    updateNotificationCaches(qc, (notification) => {
      if (notification.id !== notificationId) return notification;
      wasUnread = !notification.isRead;
      return { ...notification, isRead: true };
    });

    if (wasUnread) {
      qc.setQueryData(
        ["notifications", "unread-count"],
        Math.max(previousCount - 1, 0),
      );
    }

    notificationsSocket?.emit("mark-notification-read", { notificationId });

    try {
      await NotificationService.markAsRead(notificationId);
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    } catch {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.setQueryData(["notifications", "unread-count"], previousCount);
    }
  };

  const markAllAsRead = async () => {
    const previousCount =
      qc.getQueryData<number>(["notifications", "unread-count"]) ?? 0;

    updateNotificationCaches(qc, (notification) => ({
      ...notification,
      isRead: true,
    }));
    qc.setQueryData(["notifications", "unread-count"], 0);
    notificationsSocket?.emit("mark-all-read");

    try {
      await NotificationService.markAllAsRead();
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    } catch {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.setQueryData(["notifications", "unread-count"], previousCount);
    }
  };

  return { unreadCount, markAsRead, markAllAsRead };
};

export const useGetNotifications = (filter: NotificationFilter = "all") => {
  return useInfiniteQuery<
    NotificationsResponse,
    Error,
    InfiniteData<NotificationsResponse>,
    [string, NotificationFilter],
    string | undefined
  >({
    queryKey: ["notifications", filter],
    queryFn: ({ pageParam }): Promise<NotificationsResponse> =>
      NotificationService.getNotifications(filter, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    ...infiniteQueryOptions,
  });
};
