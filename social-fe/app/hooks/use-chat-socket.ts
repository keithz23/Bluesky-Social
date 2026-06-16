"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/providers/socket.provider";
import { Message } from "@/app/interfaces/chat.interface";

interface UseChatSocketOptions {
  onNewMessage?: (data: { message: Message; conversationId: string }) => void;
  onConversationUpdated?: (data: unknown) => void;
  onMessageEdited?: (data: {
    messageId: string;
    content: string;
    editedAt: string;
  }) => void;
  onMessageDeleted?: (data: {
    messageId: string;
    conversationId: string;
  }) => void;
  onUserTyping?: (data: {
    userId: string;
    username: string;
    conversationId: string;
  }) => void;
  onUserStopTyping?: (data: {
    userId: string;
    conversationId: string;
  }) => void;
  onMessageRead?: (data: {
    userId: string;
    messageId: string;
    conversationId: string;
  }) => void;
  onReactionUpdated?: (data: {
    messageId: string;
    reactions: unknown[];
  }) => void;
  onNewConversation?: (data: unknown) => void;
}

export function useChatSocket(options: UseChatSocketOptions = {}) {
  const { chatSocket, isConnected } = useSocket();
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!chatSocket) return;

    const handleNewMessage = (data: { message: Message; conversationId: string }) =>
      optionsRef.current.onNewMessage?.(data);
    const handleConversationUpdated = (data: unknown) =>
      optionsRef.current.onConversationUpdated?.(data);
    const handleMessageEdited = (data: {
      messageId: string;
      content: string;
      editedAt: string;
    }) => optionsRef.current.onMessageEdited?.(data);
    const handleMessageDeleted = (data: {
      messageId: string;
      conversationId: string;
    }) => optionsRef.current.onMessageDeleted?.(data);
    const handleUserTyping = (data: {
      userId: string;
      username: string;
      conversationId: string;
    }) => optionsRef.current.onUserTyping?.(data);
    const handleUserStopTyping = (data: {
      userId: string;
      conversationId: string;
    }) => optionsRef.current.onUserStopTyping?.(data);
    const handleMessageRead = (data: {
      userId: string;
      messageId: string;
      conversationId: string;
    }) => optionsRef.current.onMessageRead?.(data);
    const handleReactionUpdated = (data: {
      messageId: string;
      reactions: unknown[];
    }) => optionsRef.current.onReactionUpdated?.(data);
    const handleNewConversation = (data: unknown) =>
      optionsRef.current.onNewConversation?.(data);

    chatSocket.on("new-message", handleNewMessage);
    chatSocket.on("conversation-updated", handleConversationUpdated);
    chatSocket.on("message-edited", handleMessageEdited);
    chatSocket.on("message-deleted", handleMessageDeleted);
    chatSocket.on("user-typing", handleUserTyping);
    chatSocket.on("user-stop-typing", handleUserStopTyping);
    chatSocket.on("message-read", handleMessageRead);
    chatSocket.on("message-reaction-updated", handleReactionUpdated);
    chatSocket.on("new-conversation", handleNewConversation);

    return () => {
      chatSocket.off("new-message", handleNewMessage);
      chatSocket.off("conversation-updated", handleConversationUpdated);
      chatSocket.off("message-edited", handleMessageEdited);
      chatSocket.off("message-deleted", handleMessageDeleted);
      chatSocket.off("user-typing", handleUserTyping);
      chatSocket.off("user-stop-typing", handleUserStopTyping);
      chatSocket.off("message-read", handleMessageRead);
      chatSocket.off("message-reaction-updated", handleReactionUpdated);
      chatSocket.off("new-conversation", handleNewConversation);
    };
  }, [chatSocket]);

  const joinConversation = useCallback(
    (conversationId: string) => {
      chatSocket?.emit("join-conversation", { conversationId });
    },
    [chatSocket],
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      chatSocket?.emit("leave-conversation", { conversationId });
    },
    [chatSocket],
  );

  const sendMessage = useCallback(
    (data: {
      conversationId: string;
      content: string;
      type?: string;
      replyToId?: string;
    }) => {
      chatSocket?.emit("send-message", data);
    },
    [chatSocket],
  );

  const startTyping = useCallback(
    (conversationId: string) => {
      chatSocket?.emit("typing", { conversationId });
    },
    [chatSocket],
  );

  const stopTyping = useCallback(
    (conversationId: string) => {
      chatSocket?.emit("stop-typing", { conversationId });
    },
    [chatSocket],
  );

  const markRead = useCallback(
    (conversationId: string, messageId: string) => {
      chatSocket?.emit("mark-read", { conversationId, messageId });
    },
    [chatSocket],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      chatSocket?.emit("edit-message", { messageId, content });
    },
    [chatSocket],
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      chatSocket?.emit("delete-message", { messageId });
    },
    [chatSocket],
  );

  const reactToMessage = useCallback(
    (messageId: string, emoji: string) => {
      chatSocket?.emit("react-message", { messageId, emoji });
    },
    [chatSocket],
  );

  return {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    editMessage,
    deleteMessage,
    reactToMessage,
  };
}
