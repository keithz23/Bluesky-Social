import { IMAGE_UPLOAD_RULES } from "@/app/utils/upload-rules.util";
import { DEFAULT_POST_THEME, POST_COLOR_THEMES } from "@/app/constants/dialog.constant";
import { Button } from "@/components/ui/button";
import { Grid } from "@giphy/react-components";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Sketch } from "@uiw/react-color";
import EmojiPicker from "emoji-picker-react";
import { Image as ImageIcon, Loader2, Palette, Smile } from "lucide-react";
import type React from "react";
import ComposerFloatingPicker from "../composer-floating-picker";
import { PostComposerTheme, SubmitButtonProps } from "./types";

const gf = new GiphyFetch("ts3VubO74DkZgh3cQw6IoEdRnAMVjfK6");

type PostComposerToolbarProps = SubmitButtonProps & {
  showColorPicker: boolean;
  showEmojiPicker: boolean;
  showGifPicker: boolean;
  colorButtonRef: React.RefObject<HTMLButtonElement | null>;
  emojiButtonRef: React.RefObject<HTMLButtonElement | null>;
  gifButtonRef: React.RefObject<HTMLButtonElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedColorTheme: PostComposerTheme;
  selectedThemeId: string;
  customHex: string;
  imageDisabled: boolean;
  gifDisabled: boolean;
  hasPosterBackground: boolean;
  hasGif: boolean;
  imageCount: number;
  maxImageCount: number;
  remainingCharacters: number;
  uploadProgress: number | null;
  onToggleColorPicker: () => void;
  onToggleEmojiPicker: () => void;
  onToggleGifPicker: () => void;
  onCloseColorPicker: () => void;
  onCloseEmojiPicker: () => void;
  onCloseGifPicker: () => void;
  onSelectTheme: (themeId: string) => void;
  onCustomHexChange: (hex: string) => void;
  onAppendText: (value: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const fetchGifs = (offset: number) => gf.trending({ offset, limit: 10 });

export function PostComposerToolbar({
  showColorPicker,
  showEmojiPicker,
  showGifPicker,
  colorButtonRef,
  emojiButtonRef,
  gifButtonRef,
  fileInputRef,
  selectedColorTheme,
  selectedThemeId,
  customHex,
  imageDisabled,
  gifDisabled,
  hasPosterBackground,
  hasGif,
  imageCount,
  maxImageCount,
  remainingCharacters,
  uploadProgress,
  isPending,
  isSubmitDisabled,
  onToggleColorPicker,
  onToggleEmojiPicker,
  onToggleGifPicker,
  onCloseColorPicker,
  onCloseEmojiPicker,
  onCloseGifPicker,
  onSelectTheme,
  onCustomHexChange,
  onAppendText,
  onSelectGif,
  onFileChange,
  onSubmit,
}: PostComposerToolbarProps) {
  return (
    <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
      <ComposerFloatingPicker
        open={showColorPicker}
        anchorRef={colorButtonRef}
        width={348}
        maxHeight={460}
        onClose={onCloseColorPicker}
      >
        <div className="grid grid-cols-8 gap-2 p-3">
          {POST_COLOR_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              title={theme.label}
              aria-label={theme.label}
              onClick={() => onSelectTheme(theme.id)}
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
            onClick={() => onSelectTheme("custom")}
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
              onCustomHexChange(color.hex);
              onSelectTheme("custom");
            }}
          />
        </div>
      </ComposerFloatingPicker>

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
            hasPosterBackground
              ? "Remove poster background before adding images"
              : hasGif
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
          onClick={onToggleEmojiPicker}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white"
        >
          <Smile className="h-6 w-6" />
        </button>

        <button
          ref={colorButtonRef}
          onClick={onToggleColorPicker}
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
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </div>
    </div>
  );
}
