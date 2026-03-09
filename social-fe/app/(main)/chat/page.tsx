"use client";

import React from "react";
import { Settings, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConversations } from "@/app/hooks/use-conversations";
import ConversationList from "./components/conversation-list";
import NewChatDialog from "@/app/components/dialog/new-chat-dialog";

export default function ChatsPage() {
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useConversations();

  const conversations =
    data?.pages
      .flatMap((page) => page.conversations)
      .filter(
        (conv, i, arr) => arr.findIndex((c) => c.id === conv.id) === i,
      ) ?? [];

  const handleSettingsPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push("/chat/settings");
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat/${id}`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <div className="flex items-center gap-1">
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
            onClick={handleSettingsPage}
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <NewChatDialog />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {!isLoading && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-32 px-6">
            <div className="mb-4 text-blue-500">
              <MessageCircle className="w-12 h-12" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Nothing here
            </h2>
            <p className="text-gray-500 text-[14px] text-center">
              You have no conversations yet. Start one!
            </p>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={null}
            onSelect={handleSelectConversation}
            hasNextPage={hasNextPage}
            fetchNextPage={fetchNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
