"use client";

import React, { useEffect, useState, useCallback } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/use-auth";
import { useMessages } from "@/app/hooks/use-messages";
import { useChatSocket } from "@/app/hooks/use-chat-socket";
import {
  Conversation,
  Message,
  MessageType,
  MessagesResponse,
} from "@/app/interfaces/chat.interface";
import { ChatService } from "@/app/services/chat.service";
import { useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
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
  const [typingExpiries, setTypingExpiries] = useState<Record<string, number>>(
    {},
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useMessages(conversation.id);

  // Flatten messages (pages come newest first, each page has older messages)
  const messages =
    data?.pages
      .flatMap((page) => page.messages)
      .filter((msg, i, arr) => arr.findIndex((m) => m.id === msg.id) === i)
      .reverse() ?? [];

  const upsertLatestMessage = useCallback(
    (
      updater: (
        messages: Message[],
      ) => Message[],
    ) => {
      queryClient.setQueryData<InfiniteData<MessagesResponse>>(
        ["messages", conversation.id],
        (old) => {
          if (!old?.pages?.length) return old;

          const pages = [...old.pages];
          const latestPage = pages[0];
          pages[0] = {
            ...latestPage,
            messages: updater(latestPage.messages),
          };

          return { ...old, pages };
        },
      );
    },
    [conversation.id, queryClient],
  );

  const patchMessageEverywhere = useCallback(
    (messageId: string, patch: Partial<Message>) => {
      queryClient.setQueryData<InfiniteData<MessagesResponse>>(
        ["messages", conversation.id],
        (old) => {
          if (!old?.pages?.length) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              messages: page.messages.map((message) =>
                message.id === messageId ? { ...message, ...patch } : message,
              ),
            })),
          };
        },
      );
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
      setTypingExpiries((prev) => ({
        ...prev,
        [data.userId]: Date.now() + 4000,
      }));
    },
    [conversation.id, currentUser?.id],
  );

  const handleUserStopTyping = useCallback(
    (data: { userId: string; conversationId: string }) => {
      if (data.conversationId !== conversation.id) return;
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      setTypingExpiries((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    },
    [conversation.id],
  );

  useEffect(() => {
    if (typingUsers.length === 0) return;

    const timer = window.setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((user) => (typingExpiries[user.userId] ?? 0) > now),
      );
      setTypingExpiries((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([, expiresAt]) => expiresAt > now),
        ),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [typingExpiries, typingUsers.length]);

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
    onUserTyping: handleUserTyping,
    onUserStopTyping: handleUserStopTyping,
    onMessageRead: (data) => {
      if (data.conversationId !== conversation.id) return;
      patchMessageEverywhere(data.messageId, { status: "READ" });
    },
    onMessageEdited: () => {
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
  const handleSeenLatest = useCallback(
    (messageId: string) => {
      if (messageId.startsWith("optimistic-")) return;
      markRead(conversation.id, messageId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    [conversation.id, markRead, queryClient],
  );

  // Other participant info
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUser?.id,
  );
  const otherUser = otherParticipant?.user;
  const displayName =
    conversation.type === "DIRECT"
      ? (otherUser?.displayName ?? "Unknown")
      : (conversation.name ?? "Group Chat");

  const handleSend = async (content: string, type: MessageType = "TEXT") => {
    if (!currentUser) return;

    const tempId = `optimistic-${conversation.id}-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUser.id,
      content,
      type,
      status: "SENDING",
      replyToId: null,
      replyTo: null,
      isDeleted: false,
      isEdited: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      attachments: [],
      reactions: [],
    };

    upsertLatestMessage((latestMessages) => [
      optimisticMessage,
      ...latestMessages,
    ]);

    sendMessage({
      conversationId: conversation.id,
      content,
      type,
    });

    window.setTimeout(() => {
      patchMessageEverywhere(tempId, { status: "FAILED" });
    }, 12_000);
  };

  const handleSendImage = async (file: File) => {
    if (!currentUser) return;

    const tempId = `optimistic-${conversation.id}-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: "",
      type: "IMAGE",
      status: "SENDING",
      replyToId: null,
      replyTo: null,
      isDeleted: false,
      isEdited: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      attachments: [
        {
          id: `${tempId}-attachment`,
          url: previewUrl,
          thumbnailUrl: previewUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          width: null,
          height: null,
        },
      ],
      reactions: [],
    };

    upsertLatestMessage((latestMessages) => [
      optimisticMessage,
      ...latestMessages,
    ]);

    try {
      const uploadedMessage = await ChatService.sendMediaMessage(
        conversation.id,
        { file },
      );
      upsertLatestMessage((latestMessages) =>
        latestMessages.map((message) =>
          message.id === tempId ? uploadedMessage : message,
        ),
      );
    } catch {
      patchMessageEverywhere(tempId, { status: "FAILED" });
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
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
            <Avatar data={otherUser} className="w-9 h-9 text-sm" />
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
        onSeenLatest={handleSeenLatest}
      />

      {/* Typing indicator */}
      <TypingIndicator typingUsers={typingUsers} />

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onSendImage={handleSendImage}
        onTyping={() => startTyping(conversation.id)}
        onStopTyping={() => stopTyping(conversation.id)}
      />
    </div>
  );
}
