"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/use-auth";
import { useMessages } from "@/app/hooks/use-messages";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import { Conversation, Message } from "@/app/interfaces/chat.interface";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "@/app/components/avatar";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import TypingIndicator from "./typing-indicator";

interface ChatWindowProps {
  conversation: Conversation;
}

export default function ChatWindow({ conversation }: ChatWindowProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; username: string }[]
  >([]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(conversation.id);

  // Flatten messages (pages come newest first, each page has older messages)
  const messages =
    data?.pages
      .flatMap((page) => page.messages)
      .filter((msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i)
      .reverse() ?? [];

  const handleNewMessage = useCallback(
    (msgData: { message: Message; conversationId: string }) => {
      if (msgData.conversationId !== conversation.id) return;
      queryClient.setQueryData(["messages", conversation.id], (old: any) => {
        if (!old) return old;
        const pages = [...old.pages];
        // Append to the first page (most recent)
        pages[0] = {
          ...pages[0],
          messages: [msgData.message, ...pages[0].messages],
        };
        return { ...old, pages };
      });
    },
    [conversation.id, queryClient],
  );

  const handleUserTyping = useCallback(
    (data: { userId: string; username: string; conversationId: string }) => {
      if (data.conversationId !== conversation.id) return;
      if (data.userId === currentUser?.id) return;
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
    },
    [conversation.id, currentUser?.id],
  );

  const handleUserStopTyping = useCallback(
    (data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversation.id) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    },
    [conversation.id],
  );

  const {
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    editMessage,
    deleteMessage,
    reactToMessage,
  } = useChatSocket({
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
    onUserStopTyping: handleUserStopTyping,
    onMessageEdited: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversation.id],
      });
    },
    onMessageDeleted: (data) => {
      if (data.conversationId === conversation.id) {
        queryClient.invalidateQueries({
          queryKey: ["messages", conversation.id],
        });
      }
    },
    onReactionUpdated: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", conversation.id],
      });
    },
  });

  // Join/leave conversation room
  useEffect(() => {
    joinConversation(conversation.id);
    return () => leaveConversation(conversation.id);
  }, [conversation.id, joinConversation, leaveConversation]);

  // Mark as read when messages load or new messages arrive
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
  useEffect(() => {
    if (lastMessageId) {
      markRead(conversation.id, lastMessageId);
      // Also refresh the conversations list to clear unread badge
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [conversation.id, lastMessageId, markRead, queryClient]);

  // Other participant info
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUser?.id,
  );
  const otherUser = otherParticipant?.user;
  const displayName =
    conversation.type === "DIRECT"
      ? (otherUser?.displayName ?? "Unknown")
      : (conversation.name ?? "Group Chat");

  const handleSend = (content: string) => {
    sendMessage({
      conversationId: conversation.id,
      content,
      type: "TEXT",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/chat")}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>

          {otherUser && (
            <Avatar data={otherUser as any} className="w-9 h-9 text-sm" />
          )}

          <div>
            <h1 className="text-[15px] font-bold text-gray-900 leading-tight">
              {displayName}
            </h1>
            {conversation.type === "DIRECT" && otherUser && (
              <p className="text-[12px] text-gray-400 leading-tight">
                @{otherUser.username}
              </p>
            )}
          </div>
        </div>

        <button className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition cursor-pointer">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Messages */}
      <MessageList
        messages={messages}
        currentUserId={currentUser?.id ?? ""}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        onEdit={editMessage}
        onDelete={deleteMessage}
        onReact={reactToMessage}
      />

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={() => startTyping(conversation.id)}
        onStopTyping={() => stopTyping(conversation.id)}
      />
    </div>
  );
}
