"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import EmojiPicker from "emoji-picker-react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Camera, Laugh, Send, Smile, Sticker, X } from "lucide-react";
import { Feed } from "@/app/interfaces/feed.interface";
import { useAuth } from "@/app/hooks/use-auth";
import { useCreateReply } from "@/app/hooks/use-reply";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
import Avatar from "../avatar";
import ComposerFloatingPicker from "./composer-floating-picker";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";
import { toast } from "sonner";
import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");
const MAX_COMMENT_LENGTH = 300;
const MAX_IMAGE_COUNT = IMAGE_UPLOAD_RULES.maxPostImages;

interface CommentComposerProps {
  post: Feed;
  disabled: boolean;
  initialText?: string;
  autoFocus?: boolean;
  className?: string;
  onSubmitted?: () => void;
}

export default function CommentComposer({
  post,
  disabled,
  initialText = "",
  autoFocus = false,
  className = "",
  onSubmitted,
}: CommentComposerProps) {
  const { user } = useAuth();
  const requireAuth = useRequireAuthAction();
  const [text, setText] = useState(initialText);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const { createReply, createReplyUploadProgress } = useCreateReply(post.id);

  const hasImages = selectedImages.length > 0;
  const hasGif = Boolean(selectedGif);
  const isSubmitDisabled =
    disabled ||
    createReply.isPending ||
    (!text.trim() && !hasImages && !hasGif) ||
    text.length > MAX_COMMENT_LENGTH;

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    if (!autoFocus) return;
    const textarea = textareaRef.current;
    textarea?.focus();
    if (initialText) {
      textarea?.setSelectionRange(0, initialText.length);
      return;
    }
    textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [autoFocus, initialText]);

  const revokeImagePreviews = (images: ImagePreview[]) => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
  };

  const resetForm = () => {
    setText(initialText);
    revokeImagePreviews(selectedImages);
    setSelectedImages([]);
    setSelectedGif(null);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const appendText = (value: string) => {
    setText((current) => `${current}${value}`.slice(0, MAX_COMMENT_LENGTH));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (hasGif || disabled) return;

    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGE_COUNT - selectedImages.length;
    const toAdd = files
      .filter((file) => {
        const error = validateImageFile(file);
        if (error) {
          toast.error(error);
          return false;
        }
        return true;
      })
      .slice(0, remaining)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    if (toAdd.length > 0) {
      setSelectedImages((current) => [...current, ...toAdd]);
      setSelectedGif(null);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    if (isSubmitDisabled) return;
    if (!requireAuth()) return;

    createReply.mutate(
      hasImages
        ? {
            content: text,
            images: selectedImages.map((image) => image.file),
          }
        : {
            content: text,
            gifUrl: selectedGif ?? undefined,
          },
      {
        onSuccess: () => {
          resetForm();
          onSubmitted?.();
        },
      },
    );
  };

  const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

  return (
    <div className={`bg-white px-4 py-3 ${className}`}>
      <div className="flex items-end gap-2">
        {user && (
          <Avatar
            data={user}
            className="mb-8 size-8 border border-white text-sm sm:size-8"
          />
        )}

        <div className="min-w-0 flex-1 rounded-2xl bg-[#f0f2f5] px-3 py-2">
          <textarea
            ref={textareaRef}
            value={text}
            disabled={disabled || createReply.isPending}
            onChange={(e) =>
              setText(e.target.value.slice(0, MAX_COMMENT_LENGTH))
            }
            onFocus={() => {
              if (!user) requireAuth();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              user
                ? `Comment as ${user.displayName || user.username}`
                : "Comment"
            }
            rows={1}
            className="max-h-24 min-h-8 w-full resize-none border-none bg-transparent text-[15px] leading-6 text-gray-900 outline-none placeholder:text-gray-500 disabled:cursor-not-allowed"
          />

          {(hasImages || hasGif) && (
            <div className="mb-2 grid grid-cols-2 gap-1.5">
              {selectedImages.map((image, index) => (
                <div key={image.preview} className="relative">
                  <img
                    src={image.preview}
                    alt="Selected comment media"
                    className="h-24 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {selectedGif && (
                <div className="relative col-span-2">
                  <img
                    src={selectedGif}
                    alt="Selected GIF"
                    className="max-h-36 w-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedGif(null)}
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label="Remove GIF"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-gray-500">
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_UPLOAD_RULES.accept}
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Sticker"
                disabled={disabled}
                onClick={() => {
                  if (!user) requireAuth();
                }}
                className="rounded-full p-1 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sticker className="size-4.5" />
              </button>
              <button
                ref={emojiButtonRef}
                type="button"
                title="Emoji"
                disabled={disabled}
                onClick={() => {
                  if (!user) {
                    requireAuth();
                    return;
                  }
                  setShowGifPicker(false);
                  setShowEmojiPicker((current) => !current);
                }}
                className="rounded-full p-1 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Smile className="size-4.5" />
              </button>
              <button
                type="button"
                title="Photo"
                disabled={
                  disabled || hasGif || selectedImages.length >= MAX_IMAGE_COUNT
                }
                onClick={() => {
                  if (!user) {
                    requireAuth();
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="rounded-full p-1 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Camera className="size-4.5" />
              </button>
              <button
                ref={gifButtonRef}
                type="button"
                title="GIF"
                disabled={disabled || hasImages}
                onClick={() => {
                  if (!user) {
                    requireAuth();
                    return;
                  }
                  setShowEmojiPicker(false);
                  setShowGifPicker((current) => !current);
                }}
                className="rounded-sm px-1 py-0.5 text-[10px] font-bold transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                GIF
              </button>
              <button
                type="button"
                title="Avatar sticker"
                disabled={disabled}
                onClick={() => {
                  if (!user) requireAuth();
                }}
                className="rounded-full p-1 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Laugh className="size-4.5" />
              </button>
            </div>

            <button
              type="button"
              disabled={isSubmitDisabled}
              onClick={handleSubmit}
              className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-200 enabled:text-blue-600 disabled:cursor-not-allowed disabled:opacity-45"
              aria-label="Send comment"
            >
              <Send className="size-4.5 fill-current" />
            </button>
          </div>

          {createReply.isPending && createReplyUploadProgress !== null && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-[width]"
                style={{ width: `${createReplyUploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <ComposerFloatingPicker
        open={showEmojiPicker}
        anchorRef={emojiButtonRef}
        width={320}
        maxHeight={380}
        onClose={() => setShowEmojiPicker(false)}
      >
        <EmojiPicker
          onEmojiClick={(emoji) => appendText(emoji.emoji)}
          searchDisabled
          skinTonesDisabled
          width={320}
          height={380}
          previewConfig={{ showPreview: false }}
        />
      </ComposerFloatingPicker>

      <ComposerFloatingPicker
        open={showGifPicker}
        anchorRef={gifButtonRef}
        width={320}
        maxHeight={352}
        onClose={() => setShowGifPicker(false)}
      >
        <div className="p-2">
          <Grid
            width={304}
            columns={2}
            fetchGifs={fetchGifs}
            onGifClick={(gif, e) => {
              e.preventDefault();
              revokeImagePreviews(selectedImages);
              setSelectedImages([]);
              setSelectedGif(gif.images.original.url);
              setShowGifPicker(false);
            }}
          />
        </div>
      </ComposerFloatingPicker>
    </div>
  );
}
