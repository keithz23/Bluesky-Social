"use client";

import React from "react";
import { Conversation } from "@/app/interfaces/chat.interface";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import ConversationItem from "./conversation-item";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  hasNextPage: boolean | undefined;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  isLoading,
}: ConversationListProps) {
  const { ref } = useInfiniteScroll({
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    enabled: conversations.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-2.5 bg-gray-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeId}
          onClick={() => onSelect(conv.id)}
        />
      ))}
      {/* Infinite scroll sentinel */}
      <div ref={ref} />
      {isFetchingNextPage && (
        <p className="p-3 text-center text-gray-400 text-xs">Loading...</p>
      )}
    </div>
  );
}
