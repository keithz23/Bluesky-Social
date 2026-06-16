"use client";

import React, { useMemo, useState } from "react";
import { Message, MessageStatus } from "@/app/interfaces/chat.interface";
import { format, isToday, isYesterday } from "date-fns";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock3,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QUICK_EMOJIS = [
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F525}",
];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

function statusMeta(status: MessageStatus) {
  switch (status) {
    case "SENDING":
      return { label: "Sending", icon: Clock3 };
    case "SENT":
      return { label: "Sent", icon: Check };
    case "DELIVERED":
      return { label: "Delivered", icon: CheckCheck };
    case "READ":
      return { label: "Read", icon: CheckCheck };
    case "FAILED":
      return { label: "Failed", icon: AlertCircle };
    default:
      return { label: "Sent", icon: Check };
  }
}

const isMediaUrl = (value: string | null) => {
  if (!value) return false;
  return /^https?:\/\/.+\.(gif|jpe?g|png|webp)(\?.*)?$/i.test(value);
};

export default function MessageBubble({
  message,
  isOwn,
  showAvatar,
  isFirstInGroup,
  isLastInGroup,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? "");
  const time = new Date(message.createdAt);
  const timeStr = format(time, "h:mm a");
  const StatusIcon = statusMeta(message.status).icon;
  const statusLabel = statusMeta(message.status).label;
  const content = message.content ?? "";
  const shouldRenderContentImage =
    message.type === "IMAGE" && isMediaUrl(content);

  const bubbleRadius = useMemo(() => {
    if (isOwn) {
      return [
        "rounded-l-2xl",
        isFirstInGroup ? "rounded-tr-2xl" : "rounded-tr-md",
        isLastInGroup ? "rounded-br-2xl" : "rounded-br-md",
      ].join(" ");
    }

    return [
      "rounded-r-2xl",
      isFirstInGroup ? "rounded-tl-2xl" : "rounded-tl-md",
      isLastInGroup ? "rounded-bl-2xl" : "rounded-bl-md",
    ].join(" ");
  }, [isFirstInGroup, isLastInGroup, isOwn]);

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
        className={`mb-0.5 flex px-4 ${isOwn ? "justify-end" : "justify-start"}`}
      >
        <div className="max-w-[75%] rounded-2xl bg-slate-100 px-3.5 py-2 text-[14px] italic text-slate-400">
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex px-4 ${
        isLastInGroup ? "mb-2" : "mb-0.5"
      } ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {!isOwn && (
        <div
          className={`mr-2 flex w-7 shrink-0 items-start ${
            isFirstInGroup ? "pt-5" : ""
          }`}
        >
          {showAvatar && (
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
              {message.sender?.avatarUrl ? (
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender.displayName}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                message.sender?.displayName?.charAt(0).toUpperCase()
              )}
            </div>
          )}
        </div>
      )}

      <div
        className={`flex max-w-[78%] flex-col ${
          isOwn ? "items-end" : "items-start"
        }`}
      >
        {!isOwn && isFirstInGroup && (
          <span className="mb-1 px-1 text-[11px] font-semibold text-slate-500">
            {message.sender?.displayName}
          </span>
        )}

        <div
          className={`flex items-center gap-1 ${
            isOwn ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div
            className={`px-3.5 py-2 text-[15px] leading-relaxed break-words ${
              isOwn
                ? "bg-primary text-white"
                : "bg-slate-100 text-slate-950"
            } ${bubbleRadius}`}
          >
            {isEditing ? (
              <div className="flex min-w-48 flex-col gap-1.5">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="min-w-48 resize-none rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[14px] text-slate-900 outline-none focus:border-primary"
                  rows={1}
                  autoFocus
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(message.content ?? "");
                    }}
                    className="cursor-pointer rounded bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600 hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSubmit}
                    className="cursor-pointer rounded bg-white px-2 py-0.5 text-[11px] text-primary hover:bg-primary/10"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.type === "STICKER" ? (
                  <span className="block px-1 py-1 text-5xl leading-none">
                    {content}
                  </span>
                ) : shouldRenderContentImage ? (
                  <img
                    src={content}
                    alt="GIF"
                    className="max-h-72 max-w-full rounded-xl bg-slate-200 object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  content
                )}

                {message.attachments?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((att) =>
                      att.mimeType.startsWith("image/") ||
                      att.mimeType === "image/gif" ? (
                        <img
                          key={att.id}
                          src={att.url}
                          alt={att.fileName}
                          className="max-h-72 max-w-full rounded-md bg-slate-200 object-cover blur-0 transition"
                          style={{
                            backgroundImage: att.thumbnailUrl
                              ? `url(${att.thumbnailUrl})`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <a
                          key={att.id}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`block text-sm underline ${
                            isOwn ? "text-blue-100" : "text-primary"
                          }`}
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

          {!isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="shrink-0 cursor-pointer rounded-full p-1 opacity-0 transition-opacity hover:bg-slate-100 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isOwn ? "end" : "start"}
                className="min-w-36"
              >
                <div className="flex items-center gap-0.5 px-2 py-1.5">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReact?.(message.id, emoji)}
                      className="cursor-pointer p-0.5 text-base transition-transform hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <DropdownMenuSeparator />
                {isOwn && !message.id.startsWith("optimistic-") && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditContent(message.content ?? "");
                      setIsEditing(true);
                    }}
                    className="cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => onDelete?.(message.id)}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {message.reactions?.length > 0 && (
          <div
            className={`mt-0.5 flex flex-wrap gap-1 px-1 ${
              isOwn ? "justify-end" : "justify-start"
            }`}
          >
            {Object.entries(
              message.reactions.reduce<
                Record<string, { count: number; userIds: string[] }>
              >((acc, reaction) => {
                if (!acc[reaction.emoji]) {
                  acc[reaction.emoji] = { count: 0, userIds: [] };
                }
                acc[reaction.emoji].count++;
                acc[reaction.emoji].userIds.push(reaction.userId);
                return acc;
              }, {}),
            ).map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className="flex cursor-pointer items-center gap-0.5 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-xs shadow-sm transition hover:bg-slate-100"
              >
                <span>{emoji}</span>
                {data.count > 1 && (
                  <span className="text-slate-500">{data.count}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {isLastInGroup && (
          <span className="mt-0.5 inline-flex select-none items-center gap-1 px-1 text-[11px] text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
            {timeStr}
            {message.isEdited && " - edited"}
            {isOwn && (
              <>
                <span>-</span>
                <StatusIcon
                  className={`h-3.5 w-3.5 ${
                    message.status === "READ"
                      ? "text-primary"
                      : message.status === "FAILED"
                        ? "text-red-500"
                        : "text-slate-400"
                  }`}
                />
                <span>{statusLabel}</span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

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
    <div className="flex items-center justify-center px-4 py-3">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[12px] font-medium text-slate-500">
        {label}
      </span>
    </div>
  );
}
