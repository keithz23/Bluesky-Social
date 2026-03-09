"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/app/constants/endpoint.constant";
import { Message } from "@/app/interfaces/chat.interface";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

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
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let chatSocket: Socket;

    const initSocket = async () => {
      try {
        const { data } = await axiosInstance.get(
          API_ENDPOINT.AUTH.SOCKET_TOKEN,
        );
        const token = data.token;

        chatSocket = io(`${SERVER_URL}/chat`, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
        });

        chatSocket.on("connect", () => setIsConnected(true));
        chatSocket.on("disconnect", () => setIsConnected(false));

        chatSocket.on("new-message", (data) => options.onNewMessage?.(data));
        chatSocket.on("conversation-updated", (data) =>
          options.onConversationUpdated?.(data),
        );
        chatSocket.on("message-edited", (data) =>
          options.onMessageEdited?.(data),
        );
        chatSocket.on("message-deleted", (data) =>
          options.onMessageDeleted?.(data),
        );
        chatSocket.on("user-typing", (data) => options.onUserTyping?.(data));
        chatSocket.on("user-stop-typing", (data) =>
          options.onUserStopTyping?.(data),
        );
        chatSocket.on("message-read", (data) => options.onMessageRead?.(data));
        chatSocket.on("message-reaction-updated", (data) =>
          options.onReactionUpdated?.(data),
        );
        chatSocket.on("new-conversation", (data) =>
          options.onNewConversation?.(data),
        );

        socketRef.current = chatSocket;
      } catch (error) {
        console.error("Chat socket init failed:", error);
      }
    };

    initSocket();

    return () => {
      if (chatSocket) chatSocket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join-conversation", { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("leave-conversation", { conversationId });
  }, []);

  const sendMessage = useCallback(
    (data: {
      conversationId: string;
      content: string;
      type?: string;
      replyToId?: string;
    }) => {
      socketRef.current?.emit("send-message", data);
    },
    [],
  );

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("typing", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit("stop-typing", { conversationId });
  }, []);

  const markRead = useCallback(
    (conversationId: string, messageId: string) => {
      socketRef.current?.emit("mark-read", { conversationId, messageId });
    },
    [],
  );

  const editMessage = useCallback(
    (messageId: string, content: string) => {
      socketRef.current?.emit("edit-message", { messageId, content });
    },
    [],
  );

  const deleteMessage = useCallback((messageId: string) => {
    socketRef.current?.emit("delete-message", { messageId });
  }, []);

  const reactToMessage = useCallback(
    (messageId: string, emoji: string) => {
      socketRef.current?.emit("react-message", { messageId, emoji });
    },
    [],
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
