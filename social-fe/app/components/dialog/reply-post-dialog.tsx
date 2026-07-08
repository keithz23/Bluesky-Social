import { useState, useRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Smile,
  X,
  MessageSquare,
  Loader2,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Feed } from "@/app/interfaces/feed.interface";
import AvatarHoverCard from "../card/avatar-hover-card";
import { useCreateReply } from "@/app/hooks/use-reply";
import { useAuth } from "@/app/hooks/use-auth";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
import ComposerFloatingPicker from "./composer-floating-picker";
import { toast } from "sonner";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");
const MAX_REPLY_LENGTH = 300;
const MAX_IMAGE_COUNT = IMAGE_UPLOAD_RULES.maxPostImages;

interface ImagePreview {
  file: File;
  preview: string;
}

interface ReplyPostModalProps {
  post: Feed;
  type?: "avatar-with-input" | "icon";
  disabled?: boolean;
}

export default function ReplyPostModal({
  post,
  type,
  disabled,
}: ReplyPostModalProps) {
  const { user } = useAuth();
  const requireAuth = useRequireAuthAction();
  const [isOpen, setIsOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

  // Derived flags
  const hasImages = selectedImages.length > 0;
  const hasGif = !!selectedGif;
  const imageCount = selectedImages.length;
  const gifDisabled = hasImages;
  const imageDisabled = hasGif || imageCount >= MAX_IMAGE_COUNT;
  const hasChanges = postText.trim().length > 0 || hasImages || hasGif;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);

  const { createReply, createReplyUploadProgress } = useCreateReply(post.id);

  const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

  const revokeImagePreviews = (images: ImagePreview[]) => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
  };

  const handleTextChange = (value: string) => {
    setPostText(value.slice(0, MAX_REPLY_LENGTH));
  };

  const appendText = (value: string) => {
    setPostText((current) => `${current}${value}`.slice(0, MAX_REPLY_LENGTH));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasGif) return;

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

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
      .map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
      }));

    if (toAdd.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedImages((prev) => [...prev, ...toAdd]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeGif = () => setSelectedGif(null);

  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    return "grid-cols-2";
  };

  const resetForm = () => {
    setPostText("");
    revokeImagePreviews(selectedImages);
    setSelectedImages([]);
    setSelectedGif(null);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setShowExitConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAndReset = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (!requireAuth()) return;
      setIsOpen(true);
      return;
    }

    if (createReply.isPending) return;
    if (hasChanges) {
      setShowExitConfirm(true);
      return;
    }

    closeAndReset();
  };

  const handleCancel = () => {
    if (createReply.isPending) return;
    if (hasChanges) {
      setShowExitConfirm(true);
      return;
    }

    closeAndReset();
  };

  const handleConfirmDiscard = () => {
    closeAndReset();
  };

  const isFloatingPickerInteraction = (event: Event) => {
    const target = event.target;
    return (
      event
        .composedPath()
        .some(
          (node) =>
            node instanceof Element &&
            node.hasAttribute("data-composer-floating-picker"),
        ) ||
      (target instanceof Element &&
        Boolean(target.closest("[data-composer-floating-picker='true']")))
    );
  };

  const handleCreatePost = () => {
    if (isSubmitDisabled) return;

    const payload = hasImages
      ? {
        content: postText,
        images: selectedImages.map((img) => img.file),
      }
      : {
        content: postText,
        gifUrl: selectedGif ?? undefined,
      };

    createReply.mutate(payload, {
      onSuccess: () => {
        closeAndReset();
      },
    });
  };

  const isSubmitDisabled =
    createReply.isPending ||
    (!postText.trim() && !hasImages && !hasGif) ||
    postText.length > MAX_REPLY_LENGTH;

  return (
    <div className="px-2">
      {/* -------------------- MAIN REPLY MODAL -------------------- */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {type === "avatar-with-input" ? (
            <button
              disabled={disabled}
              className={`flex items-center gap-x-3 p-2 w-full text-left rounded-full transition-colors ${disabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:bg-gray-200"
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#FF4F5A] flex items-center justify-center text-sm text-white font-bold shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>

              <span className="text-[15px] text-gray-500">
                Write your reply
              </span>
            </button>
          ) : (
            <button
              disabled={disabled}
              className={`p-2 rounded-full transition-colors ${disabled
                ? "opacity-50 cursor-not-allowed"
                : "group-hover:bg-blue-50 cursor-pointer"
                }`}
            >
              <MessageSquare
                size={18}
                strokeWidth={2.2}
                className={`transition-colors ${disabled
                  ? "text-gray-400"
                  : "group-hover:text-blue-500 text-gray-500"
                  }`}
              />
            </button>
          )}
        </DialogTrigger>

        <DialogContent
          showCloseButton={false}
          className="max-w-150 max-h-[90vh] overflow-y-auto p-0 border-none rounded-xl shadow-lg bg-white gap-0 [&>button]:hidden"
          onInteractOutside={(e) => {
            if (isFloatingPickerInteraction(e.detail.originalEvent)) {
              e.preventDefault();
              return;
            }

            if (createReply.isPending || hasChanges) {
              e.preventDefault();
              if (!createReply.isPending) setShowExitConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (createReply.isPending || hasChanges) {
              e.preventDefault();
              if (!createReply.isPending) setShowExitConfirm(true);
            }
          }}
        >
          <DialogTitle className="sr-only">Reply to post</DialogTitle>

          <div className="flex justify-between items-center p-4">
            <button
              onClick={handleCancel}
              className="text-[#0066FF] font-medium text-[15px] hover:underline cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center gap-6">
              <Button
                onClick={handleCreatePost}
                disabled={isSubmitDisabled}
                className={`rounded-full font-bold px-5 h-9 shadow-none transition-colors ${!isSubmitDisabled
                  ? "bg-[#0066FF] text-white hover:bg-blue-700 cursor-pointer"
                  : "bg-[#A2C7FF] text-white cursor-not-allowed hover:bg-[#A2C7FF]"
                  }`}
              >
                {createReply.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Reply"
                )}
              </Button>
            </div>
          </div>

          {/* Original Post Preview */}
          <div className="px-4 flex justify-between items-start mt-2">
            <div className="flex gap-3">
              {/* Mock Avatar */}
              <AvatarHoverCard data={post} />
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[15px] text-gray-900">
                    {post.user.username}
                  </span>
                  {/* Verified Badge */}
                  {post.user.verified && (
                    <svg
                      viewBox="0 0 24 24"
                      aria-label="Verified account"
                      className="w-4.5 h-4.5 text-[#0066FF]"
                      fill="currentColor"
                    >
                      <g>
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.792-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.74 2.043 3.39-.11.457-.167.936-.167 1.41 0 2.21 1.71 4 3.918 4 .537 0 1.058-.11 1.536-.31.587 1.25 1.854 2.11 3.337 2.11 1.48 0 2.75-.86 3.336-2.11.478.2.998.31 1.536.31 2.21 0 3.918-1.79 3.918-4 0-.474-.057-.953-.167-1.41 1.216-.65 2.043-1.93 2.043-3.39zM10.25 16.5l-3.5-3.5 1.41-1.41L10.25 13.67l7.09-7.09 1.41 1.41L10.25 16.5z"></path>
                      </g>
                    </svg>
                  )}
                </div>
                <span className="text-[15px] mt-0.5">{post.content}</span>
              </div>
            </div>

            {post.media.length > 0 && (
              <div className="w-15 h-15 border border-gray-100 overflow-hidden shrink-0 bg-white flex flex-col justify-center">
                <div
                  className={`w-full h-full grid gap-px ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    } ${post.media.length > 2 ? "grid-rows-2" : "grid-rows-1"}`}
                >
                  {post.media.slice(0, 4).map((m, index) => (
                    <div
                      key={m.id || index}
                      className={`w-full h-full overflow-hidden ${post.media.length === 3 && index === 0
                        ? "row-span-2"
                        : ""
                        }`}
                    >
                      <img
                        src={m.mediaUrl}
                        alt={m.altText ?? "Reply post image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mx-4 my-3 border-b border-gray-200"></div>

          {/* Reply Input */}
          <div className="px-4 flex gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F05555] shrink-0 flex items-center justify-center text-white font-medium text-2xl">
              @
            </div>
            <div className="flex-1 pt-2">
              <textarea
                value={postText}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full resize-none border-none outline-none focus:ring-0 text-[17px] placeholder:text-gray-400 min-h-20"
                placeholder="Write your reply"
              />
            </div>
          </div>

          {hasImages && (
            <div className="px-4 pb-2 ml-14">
              <div className={`grid ${getGridClass(imageCount)} gap-1.5`}>
                {selectedImages.map((img, i) => {
                  const isThreeFirst = imageCount === 3 && i === 0;
                  return (
                    <div
                      key={i}
                      className={`relative ${isThreeFirst ? "col-span-2" : ""}`}
                    >
                      <img
                        src={img.preview}
                        alt={`Selected media ${i + 1}`}
                        className={`rounded-xl w-full object-cover border border-gray-200 ${isThreeFirst ? "max-h-48" : "max-h-40"
                          }`}
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1.5 right-1.5 bg-gray-900/60 hover:bg-gray-900 flex items-center justify-center w-6 h-6 rounded-full text-white transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {imageCount < MAX_IMAGE_COUNT && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {imageCount}/{MAX_IMAGE_COUNT} images · You can add{" "}
                  {MAX_IMAGE_COUNT - imageCount} more
                </p>
              )}
            </div>
          )}

          {hasGif && (
            <div className="relative px-4 pb-2 ml-14">
              <img
                src={selectedGif!}
                alt="Selected GIF"
                className="rounded-xl max-h-62.5 w-auto object-cover border border-gray-200"
              />
              <button
                onClick={removeGif}
                className="absolute top-2 right-6 bg-gray-900/60 hover:bg-gray-900 flex items-center justify-center w-7 h-7 rounded-full text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <hr className="border-gray-100" />

          {/* Bottom Toolbar */}
          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
            <ComposerFloatingPicker
              open={showEmojiPicker}
              anchorRef={emojiButtonRef}
              width={320}
              maxHeight={380}
              onClose={() => setShowEmojiPicker(false)}
            >
              <EmojiPicker
                onEmojiClick={(e) => appendText(e.emoji)}
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
                    setSelectedGif(gif.images.original.url);
                    setSelectedImages([]);
                    setShowGifPicker(false);
                  }}
                />
              </div>
            </ComposerFloatingPicker>

            <input
              type="file"
              accept={IMAGE_UPLOAD_RULES.accept}
              className="hidden"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <div className="flex min-w-0 items-center gap-1 rounded-full bg-blue-50/70 p-1 text-[#0066FF]">
              <button
                onClick={() => !imageDisabled && fileInputRef.current?.click()}
                disabled={imageDisabled}
                title={
                  hasGif
                    ? "Remove the GIF before adding images"
                    : imageCount >= MAX_IMAGE_COUNT
                      ? `Maximum of ${MAX_IMAGE_COUNT} images reached`
                      : "Add images"
                }
                className={`p-1.5 rounded-full transition-colors ${imageDisabled
                  ? "opacity-40 cursor-not-allowed text-gray-400"
                  : "hover:bg-blue-50 text-[#0066FF] cursor-pointer"
                  }`}
              >
                <ImageIcon className="w-6 h-6" />
              </button>

              <button
                ref={gifButtonRef}
                onClick={() => {
                  if (gifDisabled) return;
                  setShowEmojiPicker(false);
                  setShowGifPicker((current) => !current);
                }}
                disabled={gifDisabled}
                title={
                  gifDisabled
                    ? "Remove images before adding a GIF"
                    : "Add a GIF"
                }
                className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${gifDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-blue-50 cursor-pointer"
                  }`}
              >
                <div
                  className={`border-2 rounded-lg text-[10px] font-bold w-5.5 h-5.5 flex items-center justify-center ${gifDisabled
                    ? "border-gray-400 text-gray-400"
                    : "border-[#0066FF] text-[#0066FF]"
                    }`}
                >
                  GIF
                </div>
              </button>

              <button
                ref={emojiButtonRef}
                onClick={() => {
                  setShowGifPicker(false);
                  setShowEmojiPicker((current) => !current);
                }}
                className="hover:bg-blue-50 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Smile className="w-6 h-6 text-[#0066FF]" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {createReply.isPending && createReplyUploadProgress !== null && (
                <div className="flex w-28 flex-col gap-1 sm:w-36">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#0066FF] transition-[width]"
                      style={{ width: `${createReplyUploadProgress}%` }}
                    />
                  </div>
                  <span className="text-right text-[11px] font-medium text-slate-500">
                    Uploading {createReplyUploadProgress}%
                  </span>
                </div>
              )}
              <span className="text-gray-900 text-[15px]">
                {300 - postText.length}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogTitle className="sr-only">Discard reply</DialogTitle>
          <DialogContent
            className="w-full max-w-62.5 rounded-[32px] bg-white p-6 shadow-xl border-none gap-0 z-100 [&>button]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Discard reply?
              </h2>
              <p className="text-[15px] leading-snug text-gray-600 mb-6">
                This can't be undone and you'll lose your draft.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmDiscard}
                  className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37]"
                >
                  Discard
                </button>

                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#F1F5F9] py-3.5 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
