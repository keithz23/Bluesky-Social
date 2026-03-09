"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChatService } from "@/app/services/chat.service";
import ChatWindow from "../components/chat-window";

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
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ChatWindow conversation={conversation} />
      )}
    </div>
  );
}
