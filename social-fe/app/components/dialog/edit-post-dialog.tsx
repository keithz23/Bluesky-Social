"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Feed } from "@/app/interfaces/feed.interface";
import { ReplyType } from "@/app/interfaces/post.interface";
import { User } from "@/app/interfaces/user.interface";
import { useMention } from "@/app/hooks/use-metion";
import { usePost } from "@/app/hooks/use-post";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";
import { toast } from "sonner";
import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import { PostDialogHeader } from "./new-post-dialog/post-dialog-header";
import { PostAuthorRow } from "./new-post-dialog/post-author-row";
import { PostComposerEditor } from "./new-post-dialog/post-composer-editor";
import { PostPrivacyDialog } from "./new-post-dialog/post-privacy-dialog";
import { DiscardDraftDialog } from "./new-post-dialog/discard-draft-dialog";
import { DEFAULT_POST_THEME } from "@/app/constants/dialog.constant";
import { EditPostMediaPreview } from "./edit-post-dialog/edit-post-media-preview";
import { EditPostToolbar } from "./edit-post-dialog/edit-post-toolbar";

const MAX_POST_LENGTH = 300;
const MAX_IMAGE_COUNT = IMAGE_UPLOAD_RULES.maxPostImages;

interface EditPostDialogProps {
  post: Feed;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
            <PostDialogHeader
              title="Edit post"
              submitLabel="Save"
              closeLabel="Close edit post dialog"
              isPending={updatePost.isPending}
              isSubmitDisabled={isSubmitDisabled}
              onCancel={handleCancel}
              onSubmit={submitUpdate}
            />
          </DialogTitle>

          <PostAuthorRow
            user={post.user}
            replyType={replyType}
            onOpenPrivacySettings={openPrivacySettings}
          />
          <PostComposerEditor
            textareaRef={textareaRef}
            postText={postText}
            selectedColorTheme={DEFAULT_POST_THEME}
            hasPosterBackground={false}
            isMentionOpen={isMentionOpen}
            isMentionLoading={isLoading}
            mentionResults={mentionResults as User[]}
            activeIndex={activeIndex}
            onTextChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onInsertMention={insertMention}
            onActiveIndexChange={setActiveIndex}
          />

          <EditPostMediaPreview
            keptImages={keptImages}
            selectedImages={selectedImages}
            gifPreview={gifPreview}
            imageCount={imageCount}
            maxImageCount={MAX_IMAGE_COUNT}
            onRemoveExistingMedia={removeExistingMedia}
            onRemoveSelectedImage={removeSelectedImage}
            onClearGif={clearGif}
          />

          <EditPostToolbar
            showEmojiPicker={showEmojiPicker}
            showGifPicker={showGifPicker}
            emojiButtonRef={emojiButtonRef}
            gifButtonRef={gifButtonRef}
            fileInputRef={fileInputRef}
            imageDisabled={imageDisabled}
            gifDisabled={gifDisabled}
            hasGif={hasGif}
            imageCount={imageCount}
            maxImageCount={MAX_IMAGE_COUNT}
            remainingCharacters={MAX_POST_LENGTH - postText.length}
            uploadProgress={updateUploadProgress}
            isPending={updatePost.isPending}
            isSubmitDisabled={isSubmitDisabled}
            onToggleEmojiPicker={() => {
              setShowGifPicker(false);
              setShowEmojiPicker((current) => !current);
            }}
            onToggleGifPicker={() => {
              setShowEmojiPicker(false);
              setShowGifPicker((current) => !current);
            }}
            onCloseEmojiPicker={() => setShowEmojiPicker(false)}
            onCloseGifPicker={() => setShowGifPicker(false)}
            onAppendText={appendText}
            onSelectGif={(gifUrl) => {
              revokeImagePreviews(selectedImages);
              setSelectedImages([]);
              setKeepMediaIds([]);
              setSelectedGif(gifUrl);
              setShowGifPicker(false);
            }}
            onFileChange={handleFileChange}
            onSubmit={submitUpdate}
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
        onToggleAllowQuote={toggleAllowQuote}
        onToggleSaveForNextTime={() =>
          setSaveForNextTime((current) => !current)
        }
        onToggleListsExpanded={() => setIsListsExpanded((current) => !current)}
      />

      <DiscardDraftDialog
        open={showExitConfirm}
        title="Discard changes?"
        description="Your post has unsaved changes."
        showFootnote={false}
        onOpenChange={setShowExitConfirm}
        onDiscard={handleConfirmDiscard}
      />
    </>
  );
}
