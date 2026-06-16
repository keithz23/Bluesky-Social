"use client";

import { useMemo } from "react";
import { useConversations } from "./use-conversations";
import { useAuth } from "./use-auth";

export function useUnreadMessages(enabled = true) {
  const { data } = useConversations(enabled);
  const { user } = useAuth();
  const userId = user?.id;

  const unreadMessagesCount = useMemo(() => {
    if (!enabled || !data?.pages?.length || !userId) return 0;

    return data.pages
      .flatMap((page) => page.conversations)
      .reduce((total, conversation) => {
        const unread =
          conversation.participants.find(
            (participant) => participant.userId === userId,
          )?.unreadCount ?? 0;
        return total + unread;
      }, 0);
  }, [data, enabled, userId]);

  return { unreadMessagesCount };
}
