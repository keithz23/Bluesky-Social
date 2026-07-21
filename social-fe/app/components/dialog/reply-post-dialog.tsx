import { useState, useRef } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Feed } from "@/app/interfaces/feed.interface";
import { useCreateReply } from "@/app/hooks/use-reply";
import { useAuth } from "@/app/hooks/use-auth";
import { useRequireAuthAction } from "@/app/hooks/use-require-auth-action";
import { toast } from "sonner";
import {
  IMAGE_UPLOAD_RULES,
  validateImageFile,
} from "@/app/utils/upload-rules.util";
import { ImagePreview } from "@/app/interfaces/dialog/dialog.interface";
import { ReplyDialogTrigger } from "./reply-post-dialog/reply-dialog-trigger";
import { ReplyDialogHeader } from "./reply-post-dialog/reply-dialog-header";
import { ReplyComposerInput } from "./reply-post-dialog/reply-composer-input";
import { ReplyOriginalPreview } from "./reply-post-dialog/reply-original-preview";
import { ReplyMediaPreview } from "./reply-post-dialog/reply-media-preview";
import { ReplyToolbar } from "./reply-post-dialog/reply-toolbar";
import { ReplyDiscardDialog } from "./reply-post-dialog/reply-discard-dialog";

const MAX_REPLY_LENGTH = 300;
const MAX_IMAGE_COUNT = IMAGE_UPLOAD_RULES.maxPostImages;

interface ReplyPostModalProps {
  post: Feed;
  type?: "avatar-with-input" | "icon" | "text";
  disabled?: boolean;
  initialText?: string;
}

export default function ReplyPostModal({
  post,
  type,
  disabled,
  initialText = "",
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
      if (initialText) {
        setPostText((current) => current || initialText);
      }
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
          <ReplyDialogTrigger user={user} type={type} disabled={disabled} />
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

          <ReplyDialogHeader
            isPending={createReply.isPending}
            isSubmitDisabled={isSubmitDisabled}
            onCancel={handleCancel}
            onSubmit={handleCreatePost}
          />

          <ReplyOriginalPreview post={post} />

          <ReplyComposerInput
            value={postText}
            maxLength={MAX_REPLY_LENGTH}
            onChange={handleTextChange}
          />

          <ReplyMediaPreview
            selectedImages={selectedImages}
            selectedGif={selectedGif}
            maxImageCount={MAX_IMAGE_COUNT}
            onRemoveImage={removeImage}
            onRemoveGif={removeGif}
          />
          <hr className="border-gray-100" />

          <ReplyToolbar
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
            remainingCharacters={MAX_REPLY_LENGTH - postText.length}
            uploadProgress={createReplyUploadProgress}
            isPending={createReply.isPending}
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
              setSelectedGif(gifUrl);
              setSelectedImages([]);
              setShowGifPicker(false);
            }}
            onFileChange={handleFileChange}
          />
        </DialogContent>
      </Dialog>
      <ReplyDiscardDialog
        open={showExitConfirm}
        onOpenChange={setShowExitConfirm}
        onDiscard={handleConfirmDiscard}
      />
    </div>
  );
}
