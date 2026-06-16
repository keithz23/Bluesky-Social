"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ImageIcon, Laugh, SendHorizontal, Sticker, X } from "lucide-react";
import { MessageType } from "@/app/interfaces/chat.interface";

const STICKERS = [
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F602}",
  "\u{1F525}",
  "\u{1F389}",
  "\u{1F60E}",
  "\u{1F979}",
  "\u{1F64F}",
];

const GIFS = [
  {
    label: "Nice",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnFvOXlkY3NpMHhpbjU1cGVkdWQxdTRveHI1dGVubm0zZ2RkYWpjdiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/111ebonMs90YLu/giphy.gif",
  },
  {
    label: "Haha",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3FzcGh3Nm52YWNqdHg2ZG9kdWk1cHJ1bHMybHB0bnQxbmJtMmQ0ZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/10JhviFuU2gWD6/giphy.gif",
  },
  {
    label: "Done",
    url: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaG9ubml6a2tlaWszb2cwbDFrMTR6N3B3emI1Z3IxNG80Z2Ztd3hwZSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYt5jPR6QX5pnqM/giphy.gif",
  },
];

interface MessageInputProps {
  onSend: (content: string, type?: MessageType) => void;
  onSendImage: (file: File) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
}

export default function MessageInput({
  onSend,
  onSendImage,
  onTyping,
  onStopTyping,
  disabled,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const [activePanel, setActivePanel] = useState<"sticker" | "gif" | null>(
    null,
  );
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current && !typingDebounceRef.current) {
      typingDebounceRef.current = setTimeout(() => {
        typingDebounceRef.current = null;
        isTypingRef.current = true;
        onTyping();
      }, 500);
    }

    if (isTypingRef.current) {
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
        typingDebounceRef.current = null;
      }
      isTypingRef.current = false;
      onStopTyping();
    }, 4000);
  }, [onTyping, onStopTyping]);

  useEffect(() => {
    return () => {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) onStopTyping();
    };
  }, [onStopTyping]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    onSend(trimmed, "TEXT");
    setValue("");

    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onStopTyping();
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    handleTyping();

    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      onSendImage(file);
    }

    e.target.value = "";
    setActivePanel(null);
  };

  const handleSendSticker = (sticker: string) => {
    onSend(sticker, "STICKER");
    setActivePanel(null);
  };

  const handleSendGif = (url: string) => {
    onSend(url, "IMAGE");
    setActivePanel(null);
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
      {activePanel && (
        <div className="absolute bottom-full left-3 mb-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              {activePanel === "sticker" ? "Stickers" : "GIFs"}
            </span>
            <button
              type="button"
              className="app-icon-button size-7"
              onClick={() => setActivePanel(null)}
              aria-label="Close picker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {activePanel === "sticker" ? (
            <div className="grid grid-cols-4 gap-2">
              {STICKERS.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  className="flex h-12 items-center justify-center rounded-xl bg-slate-50 text-2xl transition hover:bg-primary/10"
                  onClick={() => handleSendSticker(sticker)}
                >
                  {sticker}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {GIFS.map((gif) => (
                <button
                  key={gif.url}
                  type="button"
                  className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 text-left transition hover:border-primary/30"
                  onClick={() => handleSendGif(gif.url)}
                  title={gif.label}
                >
                  <img
                    src={gif.url}
                    alt={gif.label}
                    className="h-20 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      <div className="flex items-end gap-2">
        <div className="flex h-11 shrink-0 items-center gap-1">
          <button
            type="button"
            className="app-icon-button size-8"
            title="Add image"
            aria-label="Add image"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="app-icon-button size-8"
            title="Add sticker"
            aria-label="Add sticker"
            disabled={disabled}
            onClick={() =>
              setActivePanel((panel) => (panel === "sticker" ? null : "sticker"))
            }
          >
            <Sticker className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="app-icon-button size-8"
            title="Add GIF"
            aria-label="Add GIF"
            disabled={disabled}
            onClick={() =>
              setActivePanel((panel) => (panel === "gif" ? null : "gif"))
            }
          >
            <Laugh className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex min-h-11 flex-1 items-center rounded-[24px] bg-slate-100 px-4 py-0.5 transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Write a message"
            disabled={disabled}
            rows={1}
            className="max-h-24 min-h-10 w-full resize-none overflow-y-auto border-none bg-transparent py-2.5 text-[15px] leading-5 text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!hasContent || disabled}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
            hasContent
              ? "bg-primary text-white hover:bg-primary/90 cursor-pointer"
              : "bg-slate-100 text-slate-300 cursor-default"
          }`}
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
