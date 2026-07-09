"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Image as ImageIcon,
  Loader2,
  Quote,
  Smile,
  X,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Feed } from "@/app/interfaces/feed.interface";
import { ReplyType } from "@/app/interfaces/post.interface";
import { User } from "@/app/interfaces/user.interface";
import { useMention } from "@/app/hooks/use-metion";
import { usePost } from "@/app/hooks/use-post";
import Avatar from "../avatar";
import ComposerFloatingPicker from "./composer-floating-picker";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";
import { toast } from "sonner";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");
const MAX_POST_LENGTH = 300;
const MAX_IMAGE_COUNT = IMAGE_UPLOAD_RULES.maxPostImages;

type ImagePreview = {
  file: File;
  preview: string;
};

type EditPostDialogProps = {
  post: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const toReplyType = (replyPolicy?: string): ReplyType => {
  if (replyPolicy === "NOBODY") return "nobody";
  if (replyPolicy === "CUSTOM") return "custom";
  return "anyone";
};

export default function EditPostDialog({
  post,
  open,
  onOpenChange,
}: EditPostDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const selectedImagesRef = useRef<ImagePreview[]>([]);

  const {
    query,
    isOpen: isMentionOpen,
    mentionStart,
    results: mentionResults,
    activeIndex,
    setActiveIndex,
    handleInput,
    closeMention,
    isLoading,
  } = useMention();

  const initialMediaIds = useMemo(
    () => post.media?.map((media) => media.id) ?? [],
    [post.media],
  );
  const initialReplyType = useMemo(
    () => toReplyType(post.replyPolicy),
    [post.replyPolicy],
  );

  const [postText, setPostText] = useState(post.content ?? "");
  const [keepMediaIds, setKeepMediaIds] = useState<string[]>(initialMediaIds);
  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [replyType, setReplyType] = useState<ReplyType>(initialReplyType);
  const [customSettings, setCustomSettings] = useState({
    followers: post.replyFollowers === true,
    following: post.replyFollowing === true,
    mentioned: post.replyMentioned === true,
  });
  const [allowQuote, setAllowQuote] = useState(post.allowQuote ?? true);
  const [isListsExpanded, setIsListsExpanded] = useState(false);
  const [privacyTouched, setPrivacyTouched] = useState(false);
  const [saveForNextTime, setSaveForNextTime] = useState(false);
  const { updatePost, updateUploadProgress } = usePost();

  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  const keptMedia = useMemo(
    () => post.media?.filter((media) => keepMediaIds.includes(media.id)) ?? [],
    [keepMediaIds, post.media],
  );
  const keptGif = keptMedia.find((media) => media.mediaType === "GIF");
  const keptImages = keptMedia.filter((media) => media.mediaType !== "GIF");
  const gifPreview = selectedGif ?? keptGif?.mediaUrl ?? null;
  const hasGif = Boolean(gifPreview);
  const hasImages = keptImages.length > 0 || selectedImages.length > 0;
  const imageCount = keptImages.length + selectedImages.length;
  const imageDisabled = hasGif || imageCount >= MAX_IMAGE_COUNT;
  const gifDisabled = hasImages;
  const hasMediaChanges =
    selectedImages.length > 0 ||
    Boolean(selectedGif) ||
    keepMediaIds.join("|") !== initialMediaIds.join("|");
  const hasChanges =
    postText !== (post.content ?? "") || hasMediaChanges || privacyTouched;
  const isSubmitDisabled =
    updatePost.isPending ||
    (!postText.trim() && !hasImages && !hasGif) ||
    postText.length > MAX_POST_LENGTH ||
    !hasChanges;

  const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

  const revokeImagePreviews = (images: ImagePreview[]) => {
    images.forEach((image) => URL.revokeObjectURL(image.preview));
  };

  const resetForm = () => {
    setPostText(post.content ?? "");
    setKeepMediaIds(initialMediaIds);
    setSelectedImages((current) => {
      revokeImagePreviews(current);
      return [];
    });
    setSelectedGif(null);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setIsPrivacyModalOpen(false);
    setShowExitConfirm(false);
    setReplyType(initialReplyType);
    setCustomSettings({
      followers: post.replyFollowers === true,
      following: post.replyFollowing === true,
      mentioned: post.replyMentioned === true,
    });
    setAllowQuote(post.allowQuote ?? true);
    setIsListsExpanded(false);
    setPrivacyTouched(false);
    setSaveForNextTime(false);
    closeMention();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAndReset = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (updatePost.isPending) return;
    if (hasChanges) {
      setShowExitConfirm(true);
      return;
    }

    closeAndReset();
  };

  const handleCancel = () => {
    if (updatePost.isPending) return;
    if (hasChanges) {
      setShowExitConfirm(true);
      return;
    }
    closeAndReset();
  };

  const handleConfirmDiscard = () => {
    closeAndReset();
  };

  const handleTextChange = (value: string, cursor: number) => {
    const nextValue = value.slice(0, MAX_POST_LENGTH);
    setPostText(nextValue);
    handleInput(nextValue, Math.min(cursor, nextValue.length));
  };

  const appendText = (value: string) => {
    setPostText((current) => `${current}${value}`.slice(0, MAX_POST_LENGTH));
  };

  const insertMention = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const before = postText.slice(0, mentionStart);
    const after = postText.slice(mentionStart + 1 + query.length);
    const newText = `${before}@${username} ${after}`;

    setPostText(newText);
    closeMention();

    setTimeout(() => {
      const pos = before.length + username.length + 2;
      textarea.setSelectionRange(pos, pos);
      textarea.focus();
    }, 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isMentionOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, mentionResults.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      const result = mentionResults[activeIndex] as User | undefined;
      if (result) {
        event.preventDefault();
        insertMention(result.username);
      }
    } else if (event.key === "Escape") {
      closeMention();
    }
  };

  const getGridClass = (count: number) => {
    if (count === 1) return "grid-cols-1";
    return "grid-cols-2";
  };

  const clearGif = () => {
    if (keptGif) {
      setKeepMediaIds((current) => current.filter((id) => id !== keptGif.id));
    }
    setSelectedGif(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (hasGif) return;

    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGE_COUNT - imageCount;
    if (files.length > remaining) {
      toast.error(`You can only add ${remaining} more image(s).`);
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }
      validFiles.push(file);
    }

    const toAdd = validFiles.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    if (toAdd.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedImages((current) => [...current, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingMedia = (mediaId: string) => {
    setKeepMediaIds((current) => current.filter((id) => id !== mediaId));
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages((current) => {
      URL.revokeObjectURL(current[index].preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const markPrivacyTouched = () => setPrivacyTouched(true);

  const handleSelectRadio = (type: ReplyType) => {
    markPrivacyTouched();
    setReplyType(type);
    setCustomSettings({
      followers: false,
      following: false,
      mentioned: false,
    });
  };

  const handleToggleCustom = (key: keyof typeof customSettings) => {
    markPrivacyTouched();
    setReplyType("custom");
    setCustomSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  const toggleAllowQuote = () => {
    markPrivacyTouched();
    setAllowQuote((current) => !current);
  };

  const openPrivacySettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsPrivacyModalOpen(true);
  };

  const isPrivacyDialogInteraction = (event: Event) => {
    const target = event.target as HTMLElement | null;
    return (
      isPrivacyModalOpen ||
      Boolean(target?.closest("[data-privacy-dialog='true']"))
    );
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

  const submitUpdate = () => {
    if (isSubmitDisabled) return;

    updatePost.mutate(
      {
        id: post.id,
        content: postText,
        keepMediaIds,
        images: selectedImages.map((image) => image.file),
        gifUrl: selectedGif ?? undefined,
        ...(privacyTouched && {
          replyPrivacy: {
            type: replyType,
            allowQuote,
            custom: replyType === "custom" ? customSettings : undefined,
          },
        }),
      },
      {
        onSuccess: () => closeAndReset(),
      },
    );
  };

  useEffect(() => {
    if (!open) return;
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post.id]);

  useEffect(
    () => () => {
      revokeImagePreviews(selectedImagesRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyPosition = document.body.style.position;
    const previousBodyTop = document.body.style.top;
    const previousBodyLeft = document.body.style.left;
    const previousBodyRight = document.body.style.right;
    const previousBodyWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.left = previousBodyLeft;
      document.body.style.right = previousBodyRight;
      document.body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-155 overflow-y-auto overflow-x-hidden gap-0 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl [&>button]:hidden"
          onInteractOutside={(event) => {
            if (
              isPrivacyDialogInteraction(event.detail.originalEvent) ||
              isFloatingPickerInteraction(event.detail.originalEvent)
            ) {
              event.preventDefault();
              return;
            }

            if (updatePost.isPending) {
              event.preventDefault();
              return;
            }

            event.preventDefault();
            closeAndReset();
          }}
          onEscapeKeyDown={(event) => {
            if (isPrivacyModalOpen) {
              event.preventDefault();
              return;
            }

            if (updatePost.isPending || hasChanges) {
              event.preventDefault();
              if (!updatePost.isPending) setShowExitConfirm(true);
            }
          }}
        >
          <DialogTitle asChild>
            <div className="sticky top-0 z-20 grid h-14 grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
              <button
                onClick={handleCancel}
                aria-label="Close edit post dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="justify-self-center text-base font-bold text-slate-950">
                Edit post
              </h2>
              <Button
                onClick={submitUpdate}
                disabled={isSubmitDisabled}
                className={`hidden h-9 rounded-full px-5 text-sm font-bold shadow-none transition-colors sm:inline-flex ${
                  !isSubmitDisabled
                    ? "cursor-pointer bg-[#0066FF] text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-[#A2C7FF] text-white hover:bg-[#A2C7FF]"
                }`}
              >
                {updatePost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </DialogTitle>

          <div className="flex min-w-0 gap-3 px-4 py-4">
            <Avatar data={post.user} className="h-11 w-11 sm:h-11 sm:w-11" />
            <div className="relative min-w-0 flex-1 pt-1">
              <div className="relative min-h-32 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={postText}
                  onChange={(event) => {
                    handleTextChange(
                      event.target.value,
                      event.target.selectionStart ?? 0,
                    );
                  }}
                  onKeyDown={handleKeyDown}
                  className="max-h-56 min-h-32 w-full resize-none overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-words border-none bg-transparent text-[17px] leading-6 text-slate-950 caret-slate-950 outline-none wrap-anywhere placeholder:text-slate-400 focus:ring-0"
                  placeholder="What's happening?"
                  spellCheck={false}
                />
              </div>

              {isMentionOpen && (isLoading || mentionResults.length > 0) && (
                <div className="absolute top-full left-0 z-60 mt-2 w-76 overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Searching...</span>
                      </div>
                    ) : (
                      mentionResults.map((user: User, index) => (
                        <div
                          key={user.id}
                          onClick={() => insertMention(user.username)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                            index === activeIndex
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <Avatar
                            data={user}
                            className="h-8 w-8 sm:h-8 sm:w-8"
                          />
                          <div className="flex min-w-0 flex-col">
                            <p className="truncate text-[14px] font-semibold">
                              {user.username}
                            </p>
                            <p className="truncate text-[12px] text-slate-500">
                              @{user.username}
                            </p>
                          </div>
                          {index === activeIndex && (
                            <Check className="ml-auto h-4 w-4 shrink-0 text-blue-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {hasImages && (
            <div className="ml-18 min-w-0 px-4 pb-3">
              <div className={`grid ${getGridClass(imageCount)} gap-2`}>
                {keptImages.map((media, index) => {
                  const isThreeFirst = imageCount === 3 && index === 0;
                  return (
                    <div
                      key={media.id}
                      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${
                        isThreeFirst ? "col-span-2" : ""
                      }`}
                    >
                      <img
                        src={media.mediaUrl}
                        alt={media.altText ?? `Selected media ${index + 1}`}
                        className={`w-full object-cover ${
                          isThreeFirst ? "max-h-56" : "max-h-48"
                        }`}
                      />
                      <button
                        onClick={() => removeExistingMedia(media.id)}
                        className="absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}

                {selectedImages.map((image, index) => {
                  const mediaIndex = keptImages.length + index;
                  const isThreeFirst = imageCount === 3 && mediaIndex === 0;
                  return (
                    <div
                      key={image.preview}
                      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${
                        isThreeFirst ? "col-span-2" : ""
                      }`}
                    >
                      <img
                        src={image.preview}
                        alt={`Selected media ${mediaIndex + 1}`}
                        className={`w-full object-cover ${
                          isThreeFirst ? "max-h-56" : "max-h-48"
                        }`}
                      />
                      <button
                        onClick={() => removeSelectedImage(index)}
                        className="absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {imageCount < MAX_IMAGE_COUNT && (
                <p className="mt-2 text-xs text-slate-400">
                  {imageCount}/{MAX_IMAGE_COUNT} images -{" "}
                  {MAX_IMAGE_COUNT - imageCount} remaining
                </p>
              )}
            </div>
          )}

          {hasGif && gifPreview && (
            <div className="relative ml-18 inline-block max-w-[calc(100%-4.5rem)] px-4 pb-3">
              <img
                src={gifPreview}
                alt="Selected GIF"
                className="max-h-72 max-w-full rounded-2xl border border-slate-200 object-cover"
              />
              <button
                onClick={clearGif}
                className="absolute top-2 right-6 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-1 px-4 pb-4 pl-18">
            <button
              onPointerDown={(event) => event.stopPropagation()}
              onClick={openPrivacySettings}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Globe className="h-4 w-4" strokeWidth={2} />
              {replyType === "anyone"
                ? "Anyone can interact"
                : replyType === "nobody"
                  ? "Nobody can reply"
                  : "Custom interactions"}
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
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
                  onGifClick={(gif, event) => {
                    event.preventDefault();
                    revokeImagePreviews(selectedImages);
                    setSelectedImages([]);
                    setKeepMediaIds([]);
                    setSelectedGif(gif.images.original.url);
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
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  imageDisabled
                    ? "cursor-not-allowed text-slate-300 opacity-50"
                    : "cursor-pointer text-[#0066FF] hover:bg-white"
                }`}
              >
                <ImageIcon className="h-6 w-6" />
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
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  gifDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-white"
                }`}
              >
                <div
                  className={`flex h-5.5 w-5.5 items-center justify-center rounded-lg border-2 text-[10px] font-bold ${
                    gifDisabled
                      ? "border-slate-300 text-slate-300"
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
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white"
              >
                <Smile className="h-6 w-6" />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {updatePost.isPending && updateUploadProgress !== null && (
                <div className="flex w-28 flex-col gap-1 sm:w-36">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#0066FF] transition-[width]"
                      style={{ width: `${updateUploadProgress}%` }}
                    />
                  </div>
                  <span className="text-right text-[11px] font-medium text-slate-500">
                    Uploading {updateUploadProgress}%
                  </span>
                </div>
              )}
              <span
                className={`text-sm font-medium ${
                  MAX_POST_LENGTH - postText.length < 30
                    ? "text-amber-600"
                    : "text-slate-500"
                }`}
              >
                {MAX_POST_LENGTH - postText.length}
              </span>
              <Button
                onClick={submitUpdate}
                disabled={isSubmitDisabled}
                className={`h-9 rounded-full px-5 text-sm font-bold shadow-none transition-colors sm:hidden ${
                  !isSubmitDisabled
                    ? "cursor-pointer bg-[#0066FF] text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-[#A2C7FF] text-white hover:bg-[#A2C7FF]"
                }`}
              >
                {updatePost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
        <DialogContent
          data-privacy-dialog="true"
          showCloseButton={false}
          className="max-w-100 p-6 border-none rounded-xl shadow-xl bg-white gap-0"
        >
          <DialogTitle className="flex justify-between items-center mb-4 text-xl font-bold text-black">
            Post interaction settings
            <button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogTitle>

          <p className="text-sm font-semibold mb-3">Who can reply</p>

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div
                onClick={() => handleSelectRadio("anyone")}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  replyType === "anyone"
                    ? "bg-[#EAF2FF] text-black"
                    : "bg-[#F2F4F8] text-[#444746]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] ${
                    replyType === "anyone"
                      ? "border-[#0066FF] bg-[#0066FF]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {replyType === "anyone" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-[15px] font-medium">Anyone</span>
              </div>

              <div
                onClick={() => handleSelectRadio("nobody")}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  replyType === "nobody"
                    ? "bg-[#EAF2FF] text-black"
                    : "bg-[#F2F4F8] text-[#444746]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] ${
                    replyType === "nobody"
                      ? "border-[#0066FF] bg-[#0066FF]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {replyType === "nobody" && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-[15px] font-medium">Nobody</span>
              </div>
            </div>

            {[
              { id: "followers", label: "Your followers" },
              { id: "following", label: "People you follow" },
              { id: "mentioned", label: "People you mention" },
            ].map((item) => {
              const isActive =
                customSettings[item.id as keyof typeof customSettings];
              return (
                <div
                  key={item.id}
                  onClick={() =>
                    handleToggleCustom(item.id as keyof typeof customSettings)
                  }
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? "bg-[#EAF2FF] text-black"
                      : "bg-[#F2F4F8] text-[#444746]"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border-[1.5px] ${
                      isActive
                        ? "border-[#0066FF] bg-[#0066FF]"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {isActive && (
                      <Check
                        className="w-3.5 h-3.5 text-white"
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <span className="text-[15px] font-medium">{item.label}</span>
                </div>
              );
            })}

            <div className="bg-[#F2F4F8] rounded-xl overflow-hidden mt-1">
              <div
                onClick={() => setIsListsExpanded(!isListsExpanded)}
                className="flex items-center justify-between p-3 cursor-pointer text-[#444746]"
              >
                <span className="text-[15px] font-medium">
                  Select from your lists
                </span>
                {isListsExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
              {isListsExpanded && (
                <div className="p-3 border-t border-white/40 text-[#444746] text-[15px]">
                  You don&apos;t have any lists yet.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-3 mt-2 bg-[#EAF2FF] rounded-xl text-black">
              <div className="flex items-center gap-2">
                <Quote className="w-5 h-5" />
                <span className="text-[15px] font-semibold">
                  Allow quote posts
                </span>
              </div>
              <div
                onClick={toggleAllowQuote}
                className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${
                  allowQuote
                    ? "bg-[#0066FF] justify-end"
                    : "bg-gray-400 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {replyType === "anyone" ? (
              <p className="text-[14px] text-[#444746]">
                These are your default settings
              </p>
            ) : (
              <div
                onClick={() => setSaveForNextTime(!saveForNextTime)}
                className="flex items-center gap-2 cursor-pointer text-black"
              >
                <div
                  className={`w-4 h-4 rounded-[3px] flex items-center justify-center border-[1.5px] ${
                    saveForNextTime
                      ? "border-[#0066FF] bg-[#0066FF]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {saveForNextTime && (
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="text-[14px]">
                  Save these options for next time
                </span>
              </div>
            )}

            <Button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="w-full h-11 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-[16px] shadow-none"
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogContent
            className="z-100 w-[calc(100vw-2rem)] max-w-90 gap-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl [&>button]:hidden"
            onInteractOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <div className="flex flex-col gap-4">
              <div>
                <DialogTitle className="text-[17px] font-bold text-slate-950">
                  Discard changes?
                </DialogTitle>
                <p className="mt-1.5 text-sm leading-5 text-slate-500">
                  Your post has unsaved changes.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:grid sm:grid-cols-2">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDiscard}
                  className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#E42240] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c91d37]"
                >
                  Discard
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
