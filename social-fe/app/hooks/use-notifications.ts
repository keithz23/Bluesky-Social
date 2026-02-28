"use client";

import { useEffect } from "react";
import {
  useQueryClient,
  useQuery,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useSocket } from "@/providers/socket.provider";
import { NotificationService } from "../services/notification.service";

export const useNotifications = () => {
  const { notificationsSocket, isConnected } = useSocket();
  const qc = useQueryClient();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: () => 0,
    enabled: false,
  });

  useEffect(() => {
    if (!notificationsSocket || !isConnected) return;

    const handleUnreadCount = (data: { count: number }) => {
      qc.setQueryData(["unread-count"], data.count);
    };

    const handleNewNotification = (newNoti: any) => {
      qc.setQueryData(["notifications"], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) return old;

        const currentList = old.pages[0].notifications || [];

        const isDuplicate = currentList.some(
          (noti: any) => noti.id === newNoti.id,
        );

        if (isDuplicate) {
          return old;
        }

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

    const handleInitialNotifications = (payload: any) => {
      qc.setQueryData(["notifications"], {
        pages: [payload],
        pageParams: [undefined],
      });
    };

    const handleConnect = () => {
      notificationsSocket.emit("get-notifications");
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
  }, [notificationsSocket, isConnected, qc]);

  const markAsRead = (notificationId: string) => {
    if (!notificationsSocket) return;
    notificationsSocket.emit("mark-notification-read", { notificationId });

    qc.setQueryData(["notifications"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          notifications: page.notifications.map((n: any) =>
            n.id === notificationId ? { ...n, isRead: true } : n,
          ),
        })),
      };
    });
  };

  const markAllAsRead = () => {
    if (!notificationsSocket) return;
    notificationsSocket.emit("mark-all-read");

    qc.setQueryData(["notifications"], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          notifications: page.notifications.map((n: any) => ({
            ...n,
            isRead: true,
          })),
        })),
      };
    });
  };

  return { unreadCount, markAsRead, markAllAsRead };
};

export const useGetNotifications = () => {
  return useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) => NotificationService.getNotifications(pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
};
