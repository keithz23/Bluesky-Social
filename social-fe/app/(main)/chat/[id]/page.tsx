"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChatService } from "@/app/services/chat.service";
import ChatWindow from "../components/chat-window";
import { MessageSkeleton } from "@/app/components/skeletons";

export default function ChatDetailPage() {
  const params = useParams();
  const conversationId = params.id as string;

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => ChatService.getConversation(conversationId),
    enabled: !!conversationId,
  });

  return (
    <div className="flex flex-col h-full">
      {isLoading || !conversation ? (
        <MessageSkeleton />
      ) : (
        <ChatWindow conversation={conversation} />
      )}
    </div>
  );
}
