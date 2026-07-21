import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePost } from "@/app/hooks/use-post";
import { ReplyType } from "@/app/interfaces/post.interface";
import { useMention } from "@/app/hooks/use-metion";
import { User } from "@/app/interfaces/user.interface";
import { useAuth } from "@/app/hooks/use-auth";
import { toast } from "sonner";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";
import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import {
  DEFAULT_POST_THEME,
  POST_COLOR_THEMES,
} from "@/app/constants/dialog.constant";
import { getReadableTextColor } from "@/app/utils/colors.util";
import { PostDialogHeader } from "./new-post-dialog/post-dialog-header";
import { PostAuthorRow } from "./new-post-dialog/post-author-row";
import { PostComposerEditor } from "./new-post-dialog/post-composer-editor";
import { SelectedMediaPreview } from "./new-post-dialog/selected-media-preview";
import { PostComposerToolbar } from "./new-post-dialog/post-composer-toolbar";
import { PostPrivacyDialog } from "./new-post-dialog/post-privacy-dialog";
import { DiscardDraftDialog } from "./new-post-dialog/discard-draft-dialog";

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
            <PostDialogHeader
              isPending={createPost.isPending}
              isSubmitDisabled={isSubmitDisabled}
              onCancel={handleCancel}
              onSubmit={handleCreatePost}
            />
          </DialogTitle>

          <PostAuthorRow
            user={user}
            replyType={replyType}
            onOpenPrivacySettings={openPrivacySettings}
          />
          <PostComposerEditor
            textareaRef={textareaRef}
            postText={postText}
            selectedColorTheme={selectedColorTheme}
            hasPosterBackground={hasPosterBackground}
            isMentionOpen={isMentionOpen}
            isMentionLoading={isLoading}
            mentionResults={mentionResults as User[]}
            activeIndex={activeIndex}
            onTextChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onInsertMention={insertMention}
            onActiveIndexChange={setActiveIndex}
          />

          <SelectedMediaPreview
            selectedImages={selectedImages}
            selectedGif={selectedGif}
            maxImageCount={MAX_IMAGE_COUNT}
            onRemoveImage={removeImage}
            onRemoveGif={removeGif}
          />

          <PostComposerToolbar
            showColorPicker={showColorPicker}
            showEmojiPicker={showEmojiPicker}
            showGifPicker={showGifPicker}
            colorButtonRef={colorButtonRef}
            emojiButtonRef={emojiButtonRef}
            gifButtonRef={gifButtonRef}
            fileInputRef={fileInputRef}
            selectedColorTheme={selectedColorTheme}
            selectedThemeId={selectedThemeId}
            customHex={customHex}
            imageDisabled={imageDisabled}
            gifDisabled={gifDisabled}
            hasPosterBackground={hasPosterBackground}
            hasGif={hasGif}
            imageCount={imageCount}
            maxImageCount={MAX_IMAGE_COUNT}
            remainingCharacters={MAX_POST_LENGTH - postText.length}
            uploadProgress={createUploadProgress}
            isPending={createPost.isPending}
            isSubmitDisabled={isSubmitDisabled}
            onToggleColorPicker={() => {
              setShowEmojiPicker(false);
              setShowGifPicker(false);
              setShowColorPicker((current) => !current);
            }}
            onToggleEmojiPicker={() => {
              setShowGifPicker(false);
              setShowColorPicker(false);
              setShowEmojiPicker((current) => !current);
            }}
            onToggleGifPicker={() => {
              setShowEmojiPicker(false);
              setShowColorPicker(false);
              setShowGifPicker((current) => !current);
            }}
            onCloseColorPicker={() => setShowColorPicker(false)}
            onCloseEmojiPicker={() => setShowEmojiPicker(false)}
            onCloseGifPicker={() => setShowGifPicker(false)}
            onSelectTheme={setSelectedThemeId}
            onCustomHexChange={setCustomHex}
            onAppendText={appendText}
            onSelectGif={(gifUrl) => {
              revokeImagePreviews(selectedImages);
              setSelectedGif(gifUrl);
              setSelectedImages([]);
              setShowGifPicker(false);
            }}
            onFileChange={handleFileChange}
            onSubmit={handleCreatePost}
          />
        </DialogContent>
      </Dialog>

      <PostPrivacyDialog
        open={isPrivacyModalOpen}
        replyType={replyType}
        customSettings={customSettings}
        allowQuote={allowQuote}
        saveForNextTime={saveForNextTime}
        isListsExpanded={isListsExpanded}
        onOpenChange={setIsPrivacyModalOpen}
        onSelectReplyType={handleSelectRadio}
        onToggleCustom={handleToggleCustom}
        onToggleAllowQuote={() => setAllowQuote((current) => !current)}
        onToggleSaveForNextTime={() =>
          setSaveForNextTime((current) => !current)
        }
        onToggleListsExpanded={() =>
          setIsListsExpanded((current) => !current)
        }
      />
      <DiscardDraftDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onDiscard={handleConfirmDiscard}
      />
    </>
  );
}
