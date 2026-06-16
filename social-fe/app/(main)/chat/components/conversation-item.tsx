"use client";

import React from "react";
import { Conversation } from "@/app/interfaces/chat.interface";
import { useAuth } from "@/app/hooks/use-auth";
import Avatar from "@/app/components/avatar";
import { formatDistanceToNowStrict } from "date-fns";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const { user: currentUser } = useAuth();

  // For DIRECT conversations, show the other user's info
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== currentUser?.id,
  );
  const otherUser = otherParticipant?.user;

  const displayName =
    conversation.type === "DIRECT"
      ? otherUser?.displayName ?? "Unknown User"
      : conversation.name ?? "Group Chat";

  const displayAvatar =
    conversation.type === "DIRECT" && otherUser
      ? otherUser
      : { displayName, avatarUrl: conversation.avatar ?? "" };

  // Unread count for current user
  const myParticipant = conversation.participants.find(
    (p) => p.userId === currentUser?.id,
  );
  const unreadCount = myParticipant?.unreadCount ?? 0;

  // Last message preview
  const lastMsg = conversation.lastMessage;
  let preview = "";
  if (lastMsg) {
    if (lastMsg.isDeleted) {
      preview = "Message deleted";
    } else if (lastMsg.type === "IMAGE") {
      preview = lastMsg.attachments?.length ? "Sent a photo" : "Sent a GIF";
    } else if (lastMsg.type === "STICKER") {
      preview = `Sent a sticker ${lastMsg.content ?? ""}`;
    } else {
      preview = lastMsg.content ?? "";
    }
    // Prefix with sender if not the current user
    if (lastMsg.senderId === currentUser?.id) {
      preview = `You: ${preview}`;
    }
  }

  // Relative time
  const timeAgo = conversation.lastMessageAt
    ? formatDistanceToNowStrict(new Date(conversation.lastMessageAt), {
        addSuffix: false,
      })
    : "";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 cursor-pointer text-left ${
        isActive ? "bg-blue-50" : ""
      }`}
    >
      {/* Avatar */}
      <Avatar
        data={displayAvatar as any}
        className="w-11 h-11 text-base shrink-0"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-[15px] truncate ${
              unreadCount > 0
                ? "font-bold text-gray-900"
                : "font-semibold text-gray-900"
            }`}
          >
            {displayName}
          </span>
          {timeAgo && (
            <span className="text-xs text-gray-400 shrink-0">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className={`text-[13px] truncate ${
              unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
            }`}
          >
            {preview || "No messages yet"}
          </p>
          {unreadCount > 0 && (
            <span className="shrink-0 bg-blue-500 text-white text-[11px] font-bold rounded-full min-w-4.5 h-4.5 flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
