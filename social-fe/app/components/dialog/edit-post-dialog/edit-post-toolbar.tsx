import { IMAGE_UPLOAD_RULES } from "@/app/utils/upload-rules.util";
import { Button } from "@/components/ui/button";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import EmojiPicker from "emoji-picker-react";
import { Image as ImageIcon, Loader2, Smile } from "lucide-react";
import type React from "react";
import ComposerFloatingPicker from "../composer-floating-picker";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");

type EditPostToolbarProps = {
  showEmojiPicker: boolean;
  showGifPicker: boolean;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  gifButtonRef: React.RefObject<HTMLButtonElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  imageDisabled: boolean;
  gifDisabled: boolean;
  hasGif: boolean;
  imageCount: number;
  maxImageCount: number;
  remainingCharacters: number;
  uploadProgress: number | null;
  isPending: boolean;
  isSubmitDisabled: boolean;
  onToggleEmojiPicker: () => void;
  onToggleGifPicker: () => void;
  onCloseEmojiPicker: () => void;
  onCloseGifPicker: () => void;
  onAppendText: (value: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

export function EditPostToolbar({
  showEmojiPicker,
  showGifPicker,
  emojiButtonRef,
  gifButtonRef,
  fileInputRef,
  imageDisabled,
  gifDisabled,
  hasGif,
  imageCount,
  maxImageCount,
  remainingCharacters,
  uploadProgress,
  isPending,
  isSubmitDisabled,
  onToggleEmojiPicker,
  onToggleGifPicker,
  onCloseEmojiPicker,
  onCloseGifPicker,
  onAppendText,
  onSelectGif,
  onFileChange,
  onSubmit,
}: EditPostToolbarProps) {
  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
      <ComposerFloatingPicker
        open={showEmojiPicker}
        anchorRef={emojiButtonRef}
        width={320}
        maxHeight={380}
        onClose={onCloseEmojiPicker}
      >
        <EmojiPicker
          onEmojiClick={(emoji) => onAppendText(emoji.emoji)}
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
        onClose={onCloseGifPicker}
      >
        <div className="p-2">
          <Grid
            width={304}
            columns={2}
            fetchGifs={fetchGifs}
            onGifClick={(gif, event) => {
              event.preventDefault();
              onSelectGif(gif.images.original.url);
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
        onChange={onFileChange}
      />

      <div className="flex min-w-0 items-center gap-1 rounded-full bg-blue-50/70 p-1 text-[#0066FF]">
        <button
          onClick={() => !imageDisabled && fileInputRef.current?.click()}
          disabled={imageDisabled}
          title={
            hasGif
              ? "Remove the GIF before adding images"
              : imageCount >= maxImageCount
                ? `Maximum of ${maxImageCount} images reached`
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
            onToggleGifPicker();
          }}
          disabled={gifDisabled}
          title={
            gifDisabled ? "Remove images before adding a GIF" : "Add a GIF"
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
          onClick={onToggleEmojiPicker}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white"
        >
          <Smile className="h-6 w-6" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {isPending && uploadProgress !== null && (
          <div className="flex w-28 flex-col gap-1 sm:w-36">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#0066FF] transition-[width]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-right text-[11px] font-medium text-slate-500">
              Uploading {uploadProgress}%
            </span>
          </div>
        )}
        <span
          className={`text-sm font-medium ${
            remainingCharacters < 30 ? "text-amber-600" : "text-slate-500"
          }`}
        >
          {remainingCharacters}
        </span>
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className={`h-9 rounded-full px-5 text-sm font-bold shadow-none transition-colors sm:hidden ${
            !isSubmitDisabled
              ? "cursor-pointer bg-[#0066FF] text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-[#A2C7FF] text-white hover:bg-[#A2C7FF]"
          }`}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}
