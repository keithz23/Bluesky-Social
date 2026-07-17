import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Globe,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Palette,
  Smile,
  X,
  Check,
  Quote,
  Loader2,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { usePost } from "@/app/hooks/use-post";
import { ReplyType } from "@/app/interfaces/post.interface";
import { useMention } from "@/app/hooks/use-metion";
import { User } from "@/app/interfaces/user.interface";
import { useAuth } from "@/app/hooks/use-auth";
import Avatar from "../avatar";
import ComposerFloatingPicker from "./composer-floating-picker";
import { toast } from "sonner";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";
import { Sketch } from "@uiw/react-color";
import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import {
  DEFAULT_POST_THEME,
  POST_COLOR_THEMES,
} from "@/app/constants/dialog.constant";
import { getReadableTextColor } from "@/app/utils/colors.util";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");
const MAX_POST_LENGTH = 300;
const MAX_IMAGE_COUNT = IMAGE_UPLOAD_RULES.maxPostImages;

interface NewPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewPostModal({
  open,
  onOpenChange,
}: NewPostModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const [customHex, setCustomHex] = useState("#1877f2");
  const [selectedThemeId, setSelectedThemeId] = useState(DEFAULT_POST_THEME.id);

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

  const insertMention = (username: string) => {
    const textarea = textareaRef.current!;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isMentionOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, mentionResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const result = mentionResults[activeIndex] as User | undefined;
      if (result) {
        e.preventDefault();
        insertMention(result.username);
      }
    } else if (e.key === "Escape") {
      closeMention();
    }
  };

  const [postText, setPostText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [replyType, setReplyType] = useState<ReplyType>("anyone");
  const [customSettings, setCustomSettings] = useState({
    followers: false,
    following: false,
    mentioned: false,
  });
  const [isListsExpanded, setIsListsExpanded] = useState(false);

  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

  const [allowQuote, setAllowQuote] = useState(true);
  const [saveForNextTime, setSaveForNextTime] = useState(false);

  // Derived flags
  const hasImages = selectedImages.length > 0;
  const hasGif = !!selectedGif;
  const hasPosterBackground = selectedThemeId !== DEFAULT_POST_THEME.id;
  const imageCount = selectedImages.length;
  const gifDisabled = hasPosterBackground || hasImages;
  const imageDisabled =
    hasPosterBackground || hasGif || imageCount >= MAX_IMAGE_COUNT;

  const hasChanges = postText.trim().length > 0 || hasImages || hasGif;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  const { createPost, createUploadProgress } = usePost();

  const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });
  const customTextColor = getReadableTextColor(customHex);
  const selectedColorTheme =
    selectedThemeId === "custom"
      ? {
          id: "custom",
          label: "Custom color",
          background: customHex,
          textColor: customTextColor,
          placeholderColor:
            customTextColor === "#ffffff"
              ? "rgba(255,255,255,0.78)"
              : "#64748b",
          swatch: customHex,
        }
      : (POST_COLOR_THEMES.find((theme) => theme.id === selectedThemeId) ??
        DEFAULT_POST_THEME);

  const handleSelectRadio = (type: ReplyType) => {
    setReplyType(type);
    setCustomSettings({
      followers: false,
      following: false,
      mentioned: false,
    });
  };

  const handleToggleCustom = (key: keyof typeof customSettings) => {
    setReplyType("custom");
    setCustomSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const revokeImagePreviews = (images: ImagePreview[]) => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
  };

  const handleTextChange = (value: string, cursor: number) => {
    const nextValue = value.slice(0, MAX_POST_LENGTH);
    setPostText(nextValue);
    handleInput(nextValue, Math.min(cursor, nextValue.length));
  };

  const appendText = (value: string) => {
    setPostText((current) => `${current}${value}`.slice(0, MAX_POST_LENGTH));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasPosterBackground || hasGif) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGE_COUNT - selectedImages.length;

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
    setShowColorPicker(false);
    setShowGifPicker(false);
    setIsPrivacyModalOpen(false);
    setShowExitConfirm(false);
    setIsListsExpanded(false);
    setSaveForNextTime(false);
    setSelectedThemeId(DEFAULT_POST_THEME.id);
    setCustomHex("#1877f2");
    setReplyType("anyone");
    setCustomSettings({ followers: false, following: false, mentioned: false });
    setAllowQuote(true);
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

    if (createPost.isPending) return;
    if (hasChanges) {
      setShowExitConfirm(true);
      return;
    }

    closeAndReset();
  };

  const handleCancel = () => {
    if (createPost.isPending) return;
    if (hasChanges) {
      setShowExitConfirm(true);
    } else {
      closeAndReset();
    }
  };

  const handleConfirmDiscard = () => {
    closeAndReset();
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

  const handleCreatePost = () => {
    if (isSubmitDisabled) return;

    const privacyData = {
      type: replyType,
      allowQuote,
      custom: replyType === "custom" ? customSettings : undefined,
    };
    const postTheme = hasPosterBackground
      ? {
          type: selectedThemeId,
          background: selectedColorTheme.background,
        }
      : undefined;

    const payload = hasImages
      ? {
          content: postText,
          replyPrivacy: privacyData,
          images: selectedImages.map((img) => img.file), // File[]
          postTheme,
        }
      : {
          content: postText,
          replyPrivacy: privacyData,
          gifUrl: selectedGif ?? undefined, // string | undefined
          postTheme,
        };

    createPost.mutate(payload, {
      onSuccess: () => {
        closeAndReset();
      },
    });
  };

  const isSubmitDisabled =
    createPost.isPending ||
    (!postText.trim() && !hasImages && !hasGif) ||
    postText.length > MAX_POST_LENGTH;

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
          onInteractOutside={(e) => {
            if (
              isPrivacyDialogInteraction(e.detail.originalEvent) ||
              isFloatingPickerInteraction(e.detail.originalEvent)
            ) {
              e.preventDefault();
              return;
            }

            if (createPost.isPending || hasChanges) {
              e.preventDefault();
              if (!createPost.isPending) setShowExitConfirm(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isPrivacyModalOpen) {
              e.preventDefault();
              return;
            }

            if (createPost.isPending || hasChanges) {
              e.preventDefault();
              if (!createPost.isPending) setShowExitConfirm(true);
            }
          }}
        >
          <DialogTitle asChild>
            <div className="sticky top-0 z-20 grid h-14 grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
              <button
                onClick={handleCancel}
                aria-label="Close post dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="justify-self-center text-base font-bold text-slate-950">
                Create post
              </h2>
              <Button
                onClick={handleCreatePost}
                disabled={isSubmitDisabled}
                className={`hidden h-9 rounded-full px-5 text-sm font-bold shadow-none transition-colors sm:inline-flex ${
                  !isSubmitDisabled
                    ? "cursor-pointer bg-[#0066FF] text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-[#A2C7FF] text-white hover:bg-[#A2C7FF]"
                }`}
              >
                {createPost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </DialogTitle>

          <div className="flex gap-2 p-3">
            {user ? (
              <Avatar data={user} className="h-11 w-11 sm:h-11 sm:w-11" />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF4F5A] text-lg font-bold text-white">
                @
              </div>
            )}
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-950">
                {user?.displayName || user?.username}
              </span>
              <div className="mt-1">
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
            </div>
          </div>
          <div className="flex min-w-0">
            <div className="relative min-w-0 flex-1 pt-1">
              <div
                className={`relative min-h-52 min-w-0 overflow-hidden transition-colors ${
                  !hasPosterBackground ? "" : "shadow-inner"
                }`}
                style={{
                  background: selectedColorTheme.background,
                  color: selectedColorTheme.textColor,
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={postText}
                  onChange={(e) => {
                    handleTextChange(
                      e.target.value,
                      e.target.selectionStart ?? 0,
                    );
                  }}
                  onKeyDown={handleKeyDown}
                  className="max-h-96 min-h-52 w-full resize-none overflow-x-hidden overflow-y-auto whitespace-pre-wrap wrap-break-words border-none bg-transparent px-4 py-4 text-[20px] leading-7 caret-current outline-none wrap-anywhere placeholder:text-(--composer-placeholder-color) focus:ring-0 sm:min-h-64 sm:px-5 sm:py-5 sm:text-[22px] sm:leading-8"
                  placeholder="What's happening?"
                  spellCheck={false}
                  style={
                    {
                      color: selectedColorTheme.textColor,
                      "--composer-placeholder-color":
                        selectedColorTheme.placeholderColor,
                    } as React.CSSProperties
                  }
                />
              </div>

              {isMentionOpen && (isLoading || mentionResults.length > 0) && (
                <div className="absolute top-14 left-4 z-60 w-76 max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-xl animate-in fade-in zoom-in-95 duration-100 sm:top-16 sm:left-5">
                  <div className="max-h-72 overflow-y-auto p-1.5">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Searching...</span>
                      </div>
                    ) : (
                      mentionResults.map((user: User, i) => (
                        <div
                          key={user.id}
                          onClick={() => insertMention(user.username)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={`relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                            i === activeIndex
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
                          {i === activeIndex && (
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
            <div className="min-w-0 px-4 pb-3">
              <div className={`grid ${getGridClass(imageCount)} gap-2`}>
                {selectedImages.map((img, i) => {
                  const isThreeFirst = imageCount === 3 && i === 0;
                  return (
                    <div
                      key={i}
                      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ${isThreeFirst ? "col-span-2" : ""}`}
                    >
                      <img
                        src={img.preview}
                        alt={`Selected media ${i + 1}`}
                        className={`w-full object-cover ${isThreeFirst ? "max-h-56" : "max-h-48"}`}
                      />
                      <button
                        onClick={() => removeImage(i)}
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

          {hasGif && (
            <div className="relative inline-block max-w-[calc(100%-4.5rem)] px-4 pb-3">
              <img
                src={selectedGif!}
                alt="Selected GIF"
                className="max-h-72 max-w-full rounded-2xl border border-slate-200 object-cover"
              />
              <button
                onClick={removeGif}
                className="absolute top-2 right-6 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-slate-950/65 text-white transition hover:bg-slate-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
            <ComposerFloatingPicker
              open={showColorPicker}
              anchorRef={colorButtonRef}
              width={348}
              maxHeight={460}
              onClose={() => setShowColorPicker(false)}
            >
              <div className="grid grid-cols-8 gap-2 p-3">
                {POST_COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.label}
                    aria-label={theme.label}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`h-8 w-8 cursor-pointer rounded-full border transition ${
                      selectedThemeId === theme.id
                        ? "border-[#0066FF] ring-2 ring-[#0066FF]/25"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                    style={{ background: theme.swatch }}
                  >
                    {theme.id === DEFAULT_POST_THEME.id && (
                      <span className="block h-full w-full rounded-full bg-white" />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  title="Custom color"
                  aria-label="Custom color"
                  onClick={() => setSelectedThemeId("custom")}
                  className={`h-8 w-8 cursor-pointer rounded-full border transition ${
                    selectedThemeId === "custom"
                      ? "border-[#0066FF] ring-2 ring-[#0066FF]/25"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                  style={{ background: customHex }}
                />
              </div>
              <div className="border-t border-slate-100 p-3">
                <Sketch
                  style={{ width: "100%", boxShadow: "none" }}
                  color={customHex}
                  onChange={(color) => {
                    setCustomHex(color.hex);
                    setSelectedThemeId("custom");
                  }}
                />
              </div>
            </ComposerFloatingPicker>
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
                  hasPosterBackground
                    ? "Remove poster background before adding images"
                    : hasGif
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
                  setShowColorPicker(false);
                  setShowGifPicker((current) => !current);
                }}
                disabled={gifDisabled}
                title={
                  hasPosterBackground
                    ? "Remove poster background before adding a GIF"
                    : gifDisabled
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
                  setShowColorPicker(false);
                  setShowEmojiPicker((current) => !current);
                }}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white"
              >
                <Smile className="h-6 w-6" />
              </button>

              <button
                ref={colorButtonRef}
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowGifPicker(false);
                  setShowColorPicker((current) => !current);
                }}
                title="Pick a color"
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white"
              >
                <Palette className="h-5.5 w-5.5" />
                <span
                  className="absolute right-1 bottom-1 h-2.5 w-2.5 rounded-full border border-white shadow-sm"
                  style={{ background: selectedColorTheme.swatch }}
                />
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {createPost.isPending && createUploadProgress !== null && (
                <div className="flex w-28 flex-col gap-1 sm:w-36">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-[#0066FF] transition-[width]"
                      style={{ width: `${createUploadProgress}%` }}
                    />
                  </div>
                  <span className="text-right text-[11px] font-medium text-slate-500">
                    Uploading {createUploadProgress}%
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
                onClick={handleCreatePost}
                disabled={isSubmitDisabled}
                className={`h-9 rounded-full px-5 text-sm font-bold shadow-none transition-colors sm:hidden ${
                  !isSubmitDisabled
                    ? "cursor-pointer bg-[#0066FF] text-white hover:bg-blue-700"
                    : "cursor-not-allowed bg-[#A2C7FF] text-white hover:bg-[#A2C7FF]"
                }`}
              >
                {createPost.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* -------------------- PRIVACY SETTINGS MODAL -------------------- */}
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
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${replyType === "anyone" ? "bg-[#EAF2FF] text-black" : "bg-[#F2F4F8] text-[#444746]"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] ${replyType === "anyone" ? "border-[#0066FF] bg-[#0066FF]" : "border-gray-300 bg-white"}`}
                >
                  {replyType === "anyone" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-[15px] font-medium">Anyone</span>
              </div>

              <div
                onClick={() => handleSelectRadio("nobody")}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${replyType === "nobody" ? "bg-[#EAF2FF] text-black" : "bg-[#F2F4F8] text-[#444746]"}`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] ${replyType === "nobody" ? "border-[#0066FF] bg-[#0066FF]" : "border-gray-300 bg-white"}`}
                >
                  {replyType === "nobody" && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
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
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? "bg-[#EAF2FF] text-black" : "bg-[#F2F4F8] text-[#444746]"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border-[1.5px] ${isActive ? "border-[#0066FF] bg-[#0066FF]" : "border-gray-300 bg-white"}`}
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
                  You don't have any lists yet.
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
                onClick={() => setAllowQuote(!allowQuote)}
                className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${allowQuote ? "bg-[#0066FF] justify-end" : "bg-gray-400 justify-start"}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm"></div>
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
                  className={`w-4 h-4 rounded-[3px] flex items-center justify-center border-[1.5px] ${saveForNextTime ? "border-[#0066FF] bg-[#0066FF]" : "border-gray-300 bg-white"}`}
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
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col gap-4">
              <div>
                <DialogTitle className="text-[17px] font-bold text-slate-950">
                  Discard draft?
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

              <p className="text-center text-xs leading-4 text-slate-400">
                This action cannot be undone.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
