"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Grid } from "@giphy/react-components";
import EmojiPicker from "emoji-picker-react";
import { ImageIcon, SendHorizontal, Sticker, X } from "lucide-react";
import { MessageType } from "@/app/interfaces/chat.interface";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");

type ActivePanel = "stickers" | "gifs" | null;

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
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGifs = useCallback(
    (offset: number) => gf.trending({ offset, limit: 10 }),
    [],
  );

  const stopTypingNow = useCallback(() => {
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      onStopTyping();
    }
  }, [onStopTyping]);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current && !typingDebounceRef.current) {
      typingDebounceRef.current = setTimeout(() => {
        typingDebounceRef.current = null;
        isTypingRef.current = true;
        onTyping();
      }, 500);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTypingNow();
    }, 4000);
  }, [onTyping, stopTypingNow]);

  useEffect(() => stopTypingNow, [stopTypingNow]);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed, "TEXT");
    setValue("");
    setActivePanel(null);
    stopTypingNow();
    resetTextareaHeight();
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

    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      onSendImage(file);
    }

    e.target.value = "";
    setActivePanel(null);
  };

  const handleSendSticker = (sticker: string) => {
    if (disabled) return;
    onSend(sticker, "STICKER");
    setActivePanel(null);
  };

  const handleSendGif = (url: string) => {
    if (disabled) return;
    onSend(url, "IMAGE");
    setActivePanel(null);
  };

  const togglePanel = (panel: Exclude<ActivePanel, null>) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className="relative border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
      {activePanel && (
        <div className="absolute bottom-full left-3 z-40 mb-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">
              {activePanel === "stickers" ? "Stickers" : "GIFs"}
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

          {activePanel === "stickers" ? (
            <div className="overflow-hidden rounded-xl">
              <EmojiPicker
                onEmojiClick={(emoji) => handleSendSticker(emoji.emoji)}
                searchDisabled
                skinTonesDisabled
              />
            </div>
          ) : (
            <div className="h-87.5 overflow-y-auto rounded-xl">
              <Grid
                width={296}
                columns={2}
                fetchGifs={fetchGifs}
                onGifClick={(gif, e) => {
                  e.preventDefault();
                  handleSendGif(gif.images.original.url);
                }}
              />
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
            onClick={() => {
              setActivePanel(null);
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            className="app-icon-button size-8"
            title="Add sticker"
            aria-label="Add sticker"
            disabled={disabled}
            onClick={() => togglePanel("stickers")}
          >
            <Sticker className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            className="app-icon-button size-8"
            title="Add GIF"
            aria-label="Add GIF"
            disabled={disabled}
            onClick={() => togglePanel("gifs")}
          >
            <span className="rounded-md border border-current px-1 py-0.5 text-[10px] font-bold leading-none">
              GIF
            </span>
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
          type="button"
          onClick={handleSend}
          disabled={!hasContent || disabled}
          className={`flex size-11 shrink-0 items-center justify-center rounded-full transition-colors ${
            hasContent && !disabled
              ? "cursor-pointer bg-primary text-white hover:bg-primary/90"
              : "cursor-default bg-slate-100 text-slate-300"
          }`}
        >
          <SendHorizontal className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
