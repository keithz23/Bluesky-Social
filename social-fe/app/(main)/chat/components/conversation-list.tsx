"use client";

import React from "react";
import { Conversation } from "@/app/interfaces/chat.interface";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import ConversationItem from "./conversation-item";
import {
  ConversationSkeleton,
  InfiniteScrollFooter,
} from "@/app/components/skeletons";

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
    return <ConversationSkeleton />;
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
      <InfiniteScrollFooter
        refCallback={ref}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={conversations.length > 0}
      />
    </div>
  );
}
