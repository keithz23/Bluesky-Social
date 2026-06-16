"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket.provider";
import { useAuth } from "./use-auth";
import {
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
} from "../interfaces/chat.interface";

type InfiniteConversationsData = {
  pages: ConversationsResponse[];
  pageParams?: unknown[];
};

type InfiniteMessagesData = {
  pages: MessagesResponse[];
  pageParams?: unknown[];
};

type MessagePayload = {
  message: Message;
  conversationId: string;
};

type ConversationUpdatedPayload = {
  conversationId: string;
  lastMessage?: Message;
  conversation?: Conversation;
};

const getActiveConversationId = (pathname: string) => {
  const match = pathname.match(/^\/chat\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const playMessageSound = () => {
  if (typeof window === "undefined") return;

  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof window.AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return;

  const audio = new AudioContextCtor();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(740, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    520,
    audio.currentTime + 0.12,
  );
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, audio.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.18);
  window.setTimeout(() => void audio.close(), 300);
};

export function useChatRealtime() {
  const { chatSocket, isConnected } = useSocket();
  const { user } = useAuth();
  const qc = useQueryClient();
  const pathname = usePathname();
  const alertedMessageIdsRef = useRef<Set<string>>(new Set());
  const countedUnreadMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!chatSocket || !isConnected || !user?.id) return;

    const activeConversationId = getActiveConversationId(pathname);

    const upsertMessageCache = (conversationId: string, message: Message) => {
      qc.setQueryData<InfiniteMessagesData>(
        ["messages", conversationId],
        (old) => {
          if (!old?.pages?.length) return old;

          return {
            ...old,
            pages: old.pages.map((page, pageIndex) => {
              const exists = page.messages.some((item) => item.id === message.id);
              if (exists) {
                return {
                  ...page,
                  messages: page.messages.map((item) =>
                    item.id === message.id ? message : item,
                  ),
                };
              }

              if (pageIndex !== 0) return page;

              return {
                ...page,
                messages: [message, ...page.messages],
              };
            }),
          };
        },
      );
    };

    const updateConversationCache = (
      conversationId: string,
      lastMessage: Message,
      conversation?: Conversation,
    ) => {
      let foundConversation = false;

      qc.setQueryData<InfiniteConversationsData>(["conversations"], (old) => {
        if (!old?.pages?.length) return old;

        const pages = old.pages.map((page) => ({
          ...page,
          conversations: page.conversations.map((item) => {
            if (item.id !== conversationId) return item;

            foundConversation = true;
            const shouldIncrementUnread =
              lastMessage.senderId !== user.id &&
              activeConversationId !== conversationId &&
              !countedUnreadMessageIdsRef.current.has(lastMessage.id);

            if (shouldIncrementUnread) {
              countedUnreadMessageIdsRef.current.add(lastMessage.id);
            }

            const nextConversation = conversation ?? item;

            return {
              ...nextConversation,
              lastMessage,
              lastMessageAt: lastMessage.createdAt,
              participants: nextConversation.participants.map((participant) =>
                participant.userId === user.id && shouldIncrementUnread
                  ? {
                      ...participant,
                      unreadCount: participant.unreadCount + 1,
                    }
                  : participant,
              ),
            };
          }),
        }));

        return { ...old, pages };
      });

      if (!foundConversation) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    };

    const maybeAlertIncomingMessage = (message: Message) => {
      if (message.senderId === user.id) return;
      if (activeConversationId === message.conversationId) return;
      if (alertedMessageIdsRef.current.has(message.id)) return;

      alertedMessageIdsRef.current.add(message.id);
      playMessageSound();
    };

    const handleNewMessage = ({ message, conversationId }: MessagePayload) => {
      upsertMessageCache(conversationId, message);
      updateConversationCache(conversationId, message);
      maybeAlertIncomingMessage(message);
    };

    const handleConversationUpdated = (payload: ConversationUpdatedPayload) => {
      const lastMessage = payload.lastMessage ?? payload.conversation?.lastMessage;
      if (!lastMessage) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
        return;
      }

      updateConversationCache(
        payload.conversationId,
        lastMessage,
        payload.conversation,
      );
      maybeAlertIncomingMessage(lastMessage);
    };

    const handleNewConversation = (conversation: Conversation) => {
      qc.setQueryData<InfiniteConversationsData>(["conversations"], (old) => {
        if (!old?.pages?.length) return old;
        if (
          old.pages.some((page) =>
            page.conversations.some((item) => item.id === conversation.id),
          )
        ) {
          return old;
        }

        const pages = [...old.pages];
        pages[0] = {
          ...pages[0],
          conversations: [conversation, ...pages[0].conversations],
        };
        return { ...old, pages };
      });
    };

    chatSocket.on("new-message", handleNewMessage);
    chatSocket.on("conversation-updated", handleConversationUpdated);
    chatSocket.on("new-conversation", handleNewConversation);

    return () => {
      chatSocket.off("new-message", handleNewMessage);
      chatSocket.off("conversation-updated", handleConversationUpdated);
      chatSocket.off("new-conversation", handleNewConversation);
    };
  }, [chatSocket, isConnected, pathname, qc, user?.id]);
}
