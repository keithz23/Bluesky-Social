"use client";

import React, { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Message } from "@/app/interfaces/chat.interface";
import MessageBubble, { DateSeparator } from "./message-bubble";
import { differenceInMinutes, isSameDay } from "date-fns";
import { ArrowDown, Loader2 } from "lucide-react";
import { MessageSkeleton } from "@/app/components/skeletons";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onSeenLatest?: (messageId: string) => void;
}

const GROUP_WINDOW_MINUTES = 5;
const BOTTOM_THRESHOLD = 96;

function isNearBottom(container: HTMLDivElement) {
  return (
    container.scrollHeight - container.scrollTop - container.clientHeight <
    BOTTOM_THRESHOLD
  );
}

export default function MessageList({
  messages,
  currentUserId,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
  onEdit,
  onDelete,
  onReact,
  onSeenLatest,
}: MessageListProps) {
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const prevLastMessageIdRef = useRef<string | null>(null);
  const prevScrollHeightRef = useRef(0);
  const isLoadingOlderRef = useRef(false);
  const isAtBottomRef = useRef(true);
  const [showNewMessagesCta, setShowNewMessagesCta] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    setShowNewMessagesCta(false);
    setNewMessageCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const atBottom = isNearBottom(container);
    isAtBottomRef.current = atBottom;

    if (atBottom) {
      setShowNewMessagesCta(false);
      setNewMessageCount(0);
      const latestMessage = messages[messages.length - 1];
      if (latestMessage) onSeenLatest?.(latestMessage.id);
    }
  }, [messages, onSeenLatest]);

  // Reverse infinite scroll: reaching the top loads older message history.
  useEffect(() => {
    const container = containerRef.current;
    const sentinel = topSentinelRef.current;
    if (!container || !sentinel || messages.length === 0 || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          !entry.isIntersecting ||
          isFetchingNextPage ||
          isLoadingOlderRef.current
        ) {
          return;
        }

        isLoadingOlderRef.current = true;
        prevScrollHeightRef.current = container.scrollHeight;
        void fetchNextPage();
      },
      {
        root: container,
        rootMargin: "220px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, messages.length]);

  // Keep the viewport anchored after older messages are prepended.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoadingOlderRef.current || isFetchingNextPage) return;

    const delta = container.scrollHeight - prevScrollHeightRef.current;
    if (delta > 0) container.scrollTop += delta;

    isLoadingOlderRef.current = false;
  }, [isFetchingNextPage, messages.length]);

  // Initial scroll and new-message behavior.
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    const latestMessageId = latestMessage?.id ?? null;
    const previousLastMessageId = prevLastMessageIdRef.current;
    const previousLength = prevLengthRef.current;

    if (!latestMessageId) {
      prevLengthRef.current = messages.length;
      prevLastMessageIdRef.current = latestMessageId;
      return;
    }

    const isInitialLoad = previousLength === 0;
    const hasNewLatest = latestMessageId !== previousLastMessageId;
    const appendedCount = Math.max(messages.length - previousLength, 1);
    const isOwnLatest = latestMessage.senderId === currentUserId;

    if (isInitialLoad) {
      window.requestAnimationFrame(() => {
        scrollToBottom("instant");
        onSeenLatest?.(latestMessageId);
      });
    } else if (hasNewLatest && !isLoadingOlderRef.current) {
      if (isAtBottomRef.current || isOwnLatest) {
        window.requestAnimationFrame(() => {
          scrollToBottom("smooth");
          onSeenLatest?.(latestMessageId);
        });
      } else {
        setNewMessageCount((count) => count + appendedCount);
        setShowNewMessagesCta(true);
      }
    }

    prevLengthRef.current = messages.length;
    prevLastMessageIdRef.current = latestMessageId;
  }, [currentUserId, messages, onSeenLatest, scrollToBottom]);

  const messagesWithMeta = useMemo(() => {
    const result: Array<
      | { type: "date"; date: string }
      | {
          type: "message";
          message: Message;
          isOwn: boolean;
          showAvatar: boolean;
          isFirstInGroup: boolean;
          isLastInGroup: boolean;
        }
    > = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prevMsg = messages[i - 1];
      const nextMsg = messages[i + 1];

      if (
        !prevMsg ||
        !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt))
      ) {
        result.push({ type: "date", date: msg.createdAt });
      }

      const prevGap = prevMsg
        ? Math.abs(
            differenceInMinutes(
              new Date(msg.createdAt),
              new Date(prevMsg.createdAt),
            ),
          )
        : Number.POSITIVE_INFINITY;
      const nextGap = nextMsg
        ? Math.abs(
            differenceInMinutes(
              new Date(nextMsg.createdAt),
              new Date(msg.createdAt),
            ),
          )
        : Number.POSITIVE_INFINITY;

      const isOwn = msg.senderId === currentUserId;
      const isFirstInGroup =
        !prevMsg ||
        prevMsg.senderId !== msg.senderId ||
        prevGap > GROUP_WINDOW_MINUTES ||
        !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt));
      const isLastInGroup =
        !nextMsg ||
        nextMsg.senderId !== msg.senderId ||
        nextGap > GROUP_WINDOW_MINUTES ||
        !isSameDay(new Date(msg.createdAt), new Date(nextMsg.createdAt));

      result.push({
        type: "message",
        message: msg,
        isOwn,
        showAvatar: !isOwn && isFirstInGroup,
        isFirstInGroup,
        isLastInGroup,
      });
    }

    return result;
  }, [messages, currentUserId]);

  if (isLoading) {
    return <MessageSkeleton />;
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div ref={topSentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        )}

        <div className="flex min-h-full flex-col justify-end px-0 py-3">
          {messagesWithMeta.map((item, idx) =>
            item.type === "date" ? (
              <DateSeparator key={`date-${item.date}-${idx}`} date={item.date} />
            ) : (
              <MessageBubble
                key={item.message.id}
                message={item.message}
                isOwn={item.isOwn}
                showAvatar={item.showAvatar}
                isFirstInGroup={item.isFirstInGroup}
                isLastInGroup={item.isLastInGroup}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
              />
            ),
          )}
        </div>

        <div ref={bottomRef} className="h-1" />
      </div>

      {showNewMessagesCta && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-primary/90"
        >
          <ArrowDown className="h-4 w-4" />
          {newMessageCount > 1 ? `${newMessageCount} new messages` : "New message"}
        </button>
      )}
    </div>
  );
}
