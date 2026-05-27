"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { Message } from "@/app/interfaces/chat.interface";
import MessageBubble, { DateSeparator } from "./message-bubble";
import { isSameDay } from "date-fns";

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
}: MessageListProps) {
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const isLoadingOlderRef = useRef(false);

  // Infinite scroll for older messages inside the chat scroll container.
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
        rootMargin: "250px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, messages.length]);

  // Keep the user's viewport anchored when older messages are prepended.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isLoadingOlderRef.current || isFetchingNextPage) return;

    const delta = container.scrollHeight - prevScrollHeightRef.current;
    if (delta > 0) {
      container.scrollTop += delta;
    }

    isLoadingOlderRef.current = false;
  }, [isFetchingNextPage, messages.length]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      // if prevLengthRef.current > 0 then have already messages
      const isNewMessage = prevLengthRef.current > 0;
      // condition for auto scroll bottom
      // Scroll if message few
      // why prevLengthRef.current <= 2. Because if user scroll find message history, so scroll will be deactive for user can read history message.
      if (!isNewMessage || messages.length - prevLengthRef.current <= 2) {
        bottomRef.current?.scrollIntoView({
          behavior: isNewMessage ? "smooth" : "instant",
        });
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Group messages by date and check if avatar should show
  const messagesWithMeta = useMemo(() => {
    const result: Array<
      | { type: "date"; date: string }
      | {
          type: "message";
          message: Message;
          isOwn: boolean;
          showAvatar: boolean;
        }
    > = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const prevMsg = messages[i - 1];

      // Insert date separator
      if (
        !prevMsg ||
        !isSameDay(new Date(msg.createdAt), new Date(prevMsg.createdAt))
      ) {
        result.push({ type: "date", date: msg.createdAt });
      }

      const isOwn = msg.senderId === currentUserId;
      // Show avatar on the last message in a consecutive group from the same sender
      const nextMsg = messages[i + 1];
      const showAvatar =
        !isOwn &&
        (!nextMsg ||
          nextMsg.senderId !== msg.senderId ||
          !isSameDay(new Date(msg.createdAt), new Date(nextMsg.createdAt)));

      result.push({ type: "message", message: msg, isOwn, showAvatar });
    }

    return result;
  }, [messages, currentUserId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading messages...</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto flex flex-col">
      {/* Top sentinel for loading older messages */}
      <div ref={topSentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1" />
      {messagesWithMeta.map((item, idx) =>
        item.type === "date" ? (
          <DateSeparator key={`date-${item.date}-${idx}`} date={item.date} />
        ) : (
          <MessageBubble
            key={item.message.id}
            message={item.message}
            isOwn={item.isOwn}
            showAvatar={item.showAvatar}
            onEdit={onEdit}
            onDelete={onDelete}
            onReact={onReact}
          />
        ),
      )}

      {/* Bottom anchor for auto-scroll */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
