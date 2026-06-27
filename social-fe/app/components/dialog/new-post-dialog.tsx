import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  SquarePen,
  Globe,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
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
import Avatar from "../avatar";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");
const MAX_POST_LENGTH = 300;

interface ImagePreview {
  file: File;
  preview: string;
}

interface NewPostModalProps {
  buttonName: string;
}

export default function NewPostModal({ buttonName }: NewPostModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const [isOpen, setIsOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
  const imageCount = selectedImages.length;
  const gifDisabled = hasImages;
  const imageDisabled = hasGif || imageCount >= 4;

  const hasChanges = postText.trim().length > 0 || hasImages || hasGif;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);

  const { createPost } = usePost();

  const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
      if (
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target as Node) &&
        gifButtonRef.current &&
        !gifButtonRef.current.contains(event.target as Node)
      ) {
        setShowGifPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setPostText((current) =>
      `${current}${value}`.slice(0, MAX_POST_LENGTH),
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasGif) return;

    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 4 - selectedImages.length;
    const toAdd = files
      .filter((file) => file.type.startsWith("image/"))
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
    setIsPrivacyModalOpen(false);
    setShowExitConfirm(false);
    setIsListsExpanded(false);
    setSaveForNextTime(false);
    setReplyType("anyone");
    setCustomSettings({ followers: false, following: false, mentioned: false });
    setAllowQuote(true);
    closeMention();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeAndReset = () => {
    resetForm();
    setIsOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setIsOpen(true);
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

  const handleCreatePost = () => {
    if (isSubmitDisabled) return;

    const privacyData = {
      type: replyType,
      allowQuote,
      custom: replyType === "custom" ? customSettings : undefined,
    };

    const payload = hasImages
      ? {
        content: postText,
        replyPrivacy: privacyData,
        images: selectedImages.map((img) => img.file), // File[]
      }
      : {
        content: postText,
        replyPrivacy: privacyData,
        gifUrl: selectedGif ?? undefined, // string | undefined
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

  return (
    <>
      <div className="mt-4 px-2 w-[90%] relative">
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white text-[17px] font-bold flex gap-2 items-center cursor-pointer shadow-sm">
              <SquarePen className="w-5 h-5" strokeWidth={2} />
              {buttonName}
            </Button>
          </DialogTrigger>

          <DialogContent
            className="max-w-150 max-h-[90vh] overflow-y-auto p-0 border-none rounded-xl shadow-lg bg-white gap-0"
            onInteractOutside={(e) => {
              if (isPrivacyDialogInteraction(e.detail.originalEvent)) {
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
              <div className="flex justify-between items-center p-4">
                <button
                  onClick={handleCancel}
                  className="text-[#0066FF] font-medium text-[15px] hover:underline cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-6">
                  <button className="text-[#0066FF] font-medium text-[15px] hover:underline cursor-pointer">
                    Drafts
                  </button>
                  <Button
                    onClick={handleCreatePost}
                    disabled={isSubmitDisabled}
                    className={`rounded-full font-medium px-5 h-9 shadow-none transition-colors ${!isSubmitDisabled
                        ? "bg-[#0066FF] text-white hover:bg-blue-700 cursor-pointer"
                        : "bg-[#A2C7FF] text-white cursor-not-allowed hover:bg-[#A2C7FF]"
                      }`}
                  >
                    {createPost.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Post"
                    )}
                  </Button>
                </div>
              </div>
            </DialogTitle>

            <div className="px-4 flex gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F05555] shrink-0 flex items-center justify-center text-white font-medium text-2xl">
                @
              </div>
              <div className="flex-1 pt-2 relative">
                <div className="relative flex-1 pt-2 min-h-20">
                  <div
                    className="absolute inset-0 pt-2 px-0 text-[17px] whitespace-pre-wrap wrap-break-words pointer-events-none select-none border-none"
                    aria-hidden="true"
                  >
                    {postText.split(/(\s+)/).map((part, i) => {
                      if (part.match(/^@\S+/)) {
                        return (
                          <span
                            key={i}
                            className="bg-[#0066FF]/15 text-[#0066FF] rounded-[3px] py-px"
                          >
                            {part}
                          </span>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>

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
                    className="relative w-full bg-transparent resize-none border-none outline-none focus:ring-0 text-[17px] placeholder:text-gray-500 min-h-20 z-10 text-transparent caret-black"
                    placeholder="What's up?"
                    spellCheck={false}
                  />
                </div>

                {/* Mention Dropdown */}
                {isMentionOpen && (isLoading || mentionResults.length > 0) && (
                  <div className="absolute top-full left-0 w-72 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-60 mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-72 overflow-y-auto p-1">
                      {isLoading ? (
                        <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Searching...</span>
                        </div>
                      ) : (
                        mentionResults.map((user: User, i) => (
                          <div
                            key={user.id}
                            onClick={() => insertMention(user.username)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={`relative flex cursor-pointer select-none items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none transition-colors ${i === activeIndex
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground"
                              }`}
                          >
                            <Avatar data={user} className="w-8 h-8" />
                            <div className="flex flex-col min-w-0">
                              <p className="text-[14px] font-medium truncate">
                                {user.username}
                              </p>
                              <p className="text-[12px] text-muted-foreground truncate">
                                @{user.username}
                              </p>
                            </div>
                            {i === activeIndex && (
                              <Check className="w-4 h-4 ml-auto shrink-0 text-primary" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PREVIEW: Multiple Images */}
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
                          className={`rounded-xl w-full object-cover border border-gray-200 ${isThreeFirst ? "max-h-48" : "max-h-40"}`}
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
                {imageCount < 4 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {imageCount}/4 images · You can add {4 - imageCount} more
                  </p>
                )}
              </div>
            )}

            {/* PREVIEW: GIF */}
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

            <div className="px-4 pb-3 mt-2">
              <button
                onPointerDown={(event) => event.stopPropagation()}
                onClick={openPrivacySettings}
                className="flex items-center gap-1.5 bg-[#F2F4F8] hover:bg-gray-200 text-[#444746] text-[13px] font-medium px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Globe className="w-4 h-4 text-[#444746]" strokeWidth={2} />
                {replyType === "anyone"
                  ? "Anyone can interact"
                  : replyType === "nobody"
                    ? "Nobody can reply"
                    : "Custom interactions"}
                <ChevronDown
                  className="w-4 h-4 text-[#444746]"
                  strokeWidth={2}
                />
              </button>
            </div>

            <hr className="border-gray-200" />

            <div className="relative flex justify-between items-center px-4 py-3">
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-full left-4 mb-2 z-50 shadow-xl rounded-lg"
                >
                  <EmojiPicker
                    onEmojiClick={(e) => appendText(e.emoji)}
                    searchDisabled
                    skinTonesDisabled
                  />
                </div>
              )}

              {showGifPicker && (
                <div
                  ref={gifPickerRef}
                  className="absolute bottom-full left-4 mb-2 z-50 bg-white shadow-xl rounded-lg border border-gray-100 p-2 w-75 h-87.5 overflow-y-auto"
                >
                  <Grid
                    width={280}
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
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-4 text-[#0066FF]">
                <button
                  onClick={() =>
                    !imageDisabled && fileInputRef.current?.click()
                  }
                  disabled={imageDisabled}
                  title={
                    hasGif
                      ? "Remove the GIF before adding images"
                      : imageCount >= 4
                        ? "Maximum of 4 images reached"
                        : "Add images"
                  }
                  className={`p-1.5 rounded-full transition-colors ${imageDisabled
                      ? "opacity-40 cursor-not-allowed text-gray-400"
                      : "hover:bg-blue-50 text-[#0066FF] cursor-pointer"
                    }`}
                >
                  <ImageIcon className="w-5.5 h-5.5" />
                </button>

                <button
                  ref={gifButtonRef}
                  onClick={() =>
                    !gifDisabled && setShowGifPicker(!showGifPicker)
                  }
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
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="hover:bg-blue-50 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <Smile className="w-5.5 h-5.5" />
                </button>
              </div>

              <div className="flex items-center gap-4 pr-2">
                <button className="text-[#0066FF] font-medium text-[15px] hover:underline">
                  English
                </button>
                <span className="text-gray-900 text-[15px]">
                  {MAX_POST_LENGTH - postText.length}
                </span>
                <div className="w-7 h-7 rounded-full border border-gray-200"></div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* -------------------- PRIVACY SETTINGS MODAL -------------------- */}
        <Dialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
          <DialogContent
            data-privacy-dialog="true"
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
                    <span className="text-[15px] font-medium">
                      {item.label}
                    </span>
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
      </div>
      {showExitConfirm && (
        <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <DialogTitle className="sr-only"></DialogTitle>
          <DialogContent
            className="w-full max-w-62.5 rounded-[32px] bg-white p-6 shadow-xl border-none gap-0 z-100 [&>button]:hidden"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Discard thread?
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
    </>
  );
}
