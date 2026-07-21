import { IMAGE_UPLOAD_RULES } from "@/app/utils/upload-rules.util";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import EmojiPicker from "emoji-picker-react";
import { Image as ImageIcon, Smile } from "lucide-react";
import type React from "react";
import ComposerFloatingPicker from "../composer-floating-picker";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");

type ReplyToolbarProps = {
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
  onToggleEmojiPicker: () => void;
  onToggleGifPicker: () => void;
  onCloseEmojiPicker: () => void;
  onCloseGifPicker: () => void;
  onAppendText: (value: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

export function ReplyToolbar({
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
  onToggleEmojiPicker,
  onToggleGifPicker,
  onCloseEmojiPicker,
  onCloseGifPicker,
  onAppendText,
  onSelectGif,
  onFileChange,
}: ReplyToolbarProps) {
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
          onEmojiClick={(event) => onAppendText(event.emoji)}
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
          className={`p-1.5 rounded-full transition-colors ${
            imageDisabled
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
            onToggleGifPicker();
          }}
          disabled={gifDisabled}
          title={
            gifDisabled ? "Remove images before adding a GIF" : "Add a GIF"
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
          onClick={onToggleEmojiPicker}
          className="hover:bg-blue-50 p-1.5 rounded-full transition-colors cursor-pointer"
        >
          <Smile className="w-6 h-6 text-[#0066FF]" />
        </button>
      </div>

      <div className="flex items-center gap-4">
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
        <span className="text-gray-900 text-[15px]">{remainingCharacters}</span>
      </div>
    </div>
  );
}
