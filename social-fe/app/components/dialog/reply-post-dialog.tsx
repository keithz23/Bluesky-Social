import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Smile, X, MessageSquare } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Feed } from "@/app/interfaces/feed.interface";
import AvatarHoverCard from "../card/avatar-hover-card";
import { useCreateReply } from "@/app/hooks/use-reply";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");

interface ImagePreview {
  file: File;
  preview: string;
}

interface ReplyPostModalProps {
  post: Feed;
  type?: "avatar-with-input" | "icon";
}

export default function ReplyPostModal({ post, type }: ReplyPostModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [postText, setPostText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const [selectedImages, setSelectedImages] = useState<ImagePreview[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);

  // Derived flags
  const hasImages = selectedImages.length > 0;
  const hasGif = !!selectedGif;
  const imageCount = selectedImages.length;
  const gifDisabled = hasImages;
  const imageDisabled = hasGif || imageCount >= 4;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);

  const { createReply } = useCreateReply(post.id);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 4 - selectedImages.length;
    const toAdd = files.slice(0, remaining).map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
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
    selectedImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setSelectedImages([]);
    setSelectedGif(null);
  };

  const handleCreatePost = () => {
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
        setIsOpen(false);
        resetForm();
      },
    });
  };

  const isSubmitDisabled =
    createReply.isPending || (!postText.trim() && !hasImages && !hasGif);

  return (
    <div className="px-2">
      {/* -------------------- MAIN REPLY MODAL -------------------- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {type == "avatar-with-input" ? (
            <div className="flex items-center gap-x-3 p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors w-full">
              <div className="w-8 h-8 rounded-full bg-[#FF4F5A] flex items-center justify-center text-sm text-white font-bold shrink-0 overflow-hidden">
                {post.user?.avatarUrl ? (
                  <img
                    src={post?.user.avatarUrl}
                    alt={post?.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  post?.user?.username?.charAt(0).toUpperCase()
                )}
              </div>

              <span className="text-[15px] text-gray-500">
                Write your reply
              </span>
            </div>
          ) : (
            <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors cursor-pointer">
              <MessageSquare
                size={18}
                strokeWidth={2.2}
                className="group-hover:text-blue-500 transition-colors text-gray-500"
              />
            </div>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-150 p-0 border-none rounded-xl shadow-lg bg-white gap-0">
          <DialogTitle asChild>
            <div className="flex justify-between items-center p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#0066FF] font-medium text-[15px] hover:underline cursor-pointer"
              >
                Cancel
              </button>
              <div className="flex items-center gap-6">
                <Button
                  onClick={handleCreatePost}
                  disabled={isSubmitDisabled}
                  className={`rounded-full font-bold px-5 h-9 shadow-none transition-colors ${
                    !isSubmitDisabled
                      ? "bg-[#0066FF] text-white hover:bg-blue-700 cursor-pointer"
                      : "bg-[#A2C7FF] text-white cursor-not-allowed hover:bg-[#A2C7FF]"
                  }`}
                >
                  {createReply.isPending ? "Processing..." : "Reply"}
                </Button>
              </div>
            </div>
          </DialogTitle>

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

            {/* Mock Thumbnail Image */}
            <div className="w-15 h-15 border border-gray-100 overflow-hidden shrink-0 bg-white flex flex-col justify-center">
              <div
                className={`w-full h-full grid gap-px ${
                  post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
                } ${post.media.length > 2 ? "grid-rows-2" : "grid-rows-1"}`}
              >
                {post.media.slice(0, 4).map((m, index) => (
                  <div
                    key={m.id || index}
                    className={`w-full h-full overflow-hidden ${
                      post.media.length === 3 && index === 0 ? "row-span-2" : ""
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
                onChange={(e) => setPostText(e.target.value)}
                className="w-full resize-none border-none outline-none focus:ring-0 text-[17px] placeholder:text-gray-400 min-h-20"
                placeholder="Write your reply"
              />
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
                        className={`rounded-xl w-full object-cover border border-gray-200 ${
                          isThreeFirst ? "max-h-48" : "max-h-40"
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

          <hr className="border-gray-100" />

          {/* Bottom Toolbar */}
          <div className="relative flex justify-between items-center px-4 py-3">
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-4 mb-2 z-50 shadow-xl rounded-lg"
              >
                <EmojiPicker
                  onEmojiClick={(e) => setPostText((prev) => prev + e.emoji)}
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

            <div className="flex items-center gap-3 text-[#0066FF]">
              <button
                onClick={() => !imageDisabled && fileInputRef.current?.click()}
                disabled={imageDisabled}
                title={
                  hasGif
                    ? "Remove the GIF before adding images"
                    : imageCount >= 4
                      ? "Maximum of 4 images reached"
                      : "Add images"
                }
                className={`p-1.5 rounded-full transition-colors ${
                  imageDisabled
                    ? "opacity-40 cursor-not-allowed text-gray-400"
                    : "hover:bg-blue-50 text-[#0066FF] cursor-pointer"
                }`}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                ref={gifButtonRef}
                onClick={() => !gifDisabled && setShowGifPicker(!showGifPicker)}
                disabled={gifDisabled}
                title={
                  gifDisabled
                    ? "Remove images before adding a GIF"
                    : "Add a GIF"
                }
                className={`p-1.5 rounded-full transition-colors flex items-center justify-center ${
                  gifDisabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-blue-50 cursor-pointer"
                }`}
              >
                <div
                  className={`border-2 rounded-lg text-[10px] font-bold w-5.5 h-5.5 flex items-center justify-center ${
                    gifDisabled
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
                <Smile className="w-5 h-5 text-[#0066FF]" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-[#0066FF] font-medium text-[15px] hover:underline cursor-pointer">
                English
              </button>
              <span className="text-gray-900 text-[15px]">
                {300 - postText.length}
              </span>
              <div className="w-6.5 h-6.5 rounded-full border border-gray-200"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
