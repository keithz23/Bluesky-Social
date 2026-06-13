"use client";

import React, { useState } from "react";
import { Message } from "@/app/interfaces/chat.interface";
import { format, isToday, isYesterday } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, SmilePlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? "");
  const time = new Date(message.createdAt);
  const timeStr = format(time, "h:mm a");

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEditSubmit();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditContent(message.content ?? "");
    }
  };

  if (message.isDeleted) {
    return (
      <div
        className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 mb-0.5`}
      >
        <div className="max-w-[75%] px-3.5 py-2 rounded-2xl bg-gray-100 text-gray-400 italic text-[14px]">
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 mb-0.5 group`}
    >
      {/* Other user avatar (shown for first message in a group) */}
      {!isOwn && (
        <div className="w-7 mr-2 shrink-0 self-end">
          {showAvatar && (
            <div className="w-7 h-7 rounded-full bg-[#FF4F5A] flex items-center justify-center text-xs text-white font-bold overflow-hidden">
              {message.sender?.avatarUrl ? (
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                message.sender?.displayName?.charAt(0).toUpperCase()
              )}
            </div>
          )}
        </div>
      )}

      <div
        className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Bubble + action button row */}
        <div className={`flex items-center gap-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
          {/* Bubble */}
          <div
            className={`px-3.5 py-2 text-[15px] leading-relaxed wrap-break-word break-all ${
              isOwn
                ? "bg-blue-500 text-white rounded-2xl rounded-br-md"
                : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md"
            }`}
          >
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="bg-white text-gray-900 rounded-lg px-2.5 py-1.5 text-[14px] resize-none outline-none border border-gray-200 focus:border-blue-400 min-w-48"
                  rows={1}
                  autoFocus
                />
                <div className="flex gap-1.5 justify-end">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content ?? "");
                    }}
                    className="text-[11px] px-2 py-0.5 rounded bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="text-[11px] px-2 py-0.5 rounded bg-white text-blue-500 hover:bg-blue-50 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.content}

                {/* Attachments */}
                {message.attachments?.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {message.attachments.map((att) =>
                      att.mimeType.startsWith("image/") ? (
                        <img
                          key={att.id}
                          src={att.url}
                          alt={att.fileName}
                          className="rounded-lg max-w-full max-h-60 object-cover"
                        />
                      ) : (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block text-sm underline ${isOwn ? "text-blue-100" : "text-blue-500"}`}
                        >
                          {att.fileName}
                        </a>
                      ),
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action menu trigger (visible on hover) */}
          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isOwn ? "end" : "start"}
                className="min-w-36"
              >
                {/* Quick emoji reactions */}
                <div className="flex items-center gap-0.5 px-2 py-1.5">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(message.id, emoji)}
                      className="text-base hover:scale-125 transition-transform cursor-pointer p-0.5"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <DropdownMenuSeparator />
                {isOwn && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditContent(message.content ?? "");
                      setIsEditing(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete?.(message.id)}
                  className="text-red-500 focus:text-red-500 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Reactions display */}
        {message.reactions?.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-0.5 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
            {Object.entries(
              message.reactions.reduce<Record<string, { count: number; userIds: string[] }>>(
                (acc, r) => {
                  if (!acc[r.emoji]) acc[r.emoji] = { count: 0, userIds: [] };
                  acc[r.emoji].count++;
                  acc[r.emoji].userIds.push(r.userId);
                  return acc;
                },
                {},
              ),
            ).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className="flex items-center gap-0.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-1.5 py-0.5 transition cursor-pointer border border-gray-200"
              >
                <span>{emoji}</span>
                {data.count > 1 && (
                  <span className="text-gray-500">{data.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Time + edited indicator (shown on hover) */}
        <span className="text-[11px] text-gray-400 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity select-none">
          {timeStr}
          {message.isEdited && " · edited"}
        </span>
      </div>
    </div>
  );
}

/** Render a date separator between message groups */
export function DateSeparator({ date }: { date: string }) {
  const d = new Date(date);
  let label: string;
  if (isToday(d)) {
    label = "Today";
  } else if (isYesterday(d)) {
    label = "Yesterday";
  } else {
    label = format(d, "MMM d, yyyy");
  }

  return (
    <div className="flex items-center justify-center py-3 px-4">
      <span className="text-[12px] font-medium text-gray-400 bg-white px-3">
        {label}
      </span>
    </div>
  );
}
