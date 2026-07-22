import { User } from "@/app/interfaces/user.interface";
import { Check, Loader2 } from "lucide-react";
import type React from "react";
import Avatar from "../../avatar";
import { PostComposerTheme } from "./types";

type PostComposerEditorProps = {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  postText: string;
  selectedColorTheme: PostComposerTheme;
  hasPosterBackground: boolean;
  isMentionOpen: boolean;
  isMentionLoading: boolean;
  mentionResults: User[];
  activeIndex: number;
  onTextChange: (value: string, cursor: number) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onInsertMention: (username: string) => void;
  onActiveIndexChange: (index: number) => void;
};

export function PostComposerEditor({
  textareaRef,
  postText,
  selectedColorTheme,
  hasPosterBackground,
  isMentionOpen,
  isMentionLoading,
  mentionResults,
  activeIndex,
  onTextChange,
  onKeyDown,
  onInsertMention,
  onActiveIndexChange,
}: PostComposerEditorProps) {
  return (
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
            onChange={(event) => {
              onTextChange(
                event.target.value,
                event.target.selectionStart ?? 0,
              );
            }}
            onKeyDown={onKeyDown}
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

        {isMentionOpen &&
          (isMentionLoading || mentionResults.length > 0) && (
            <div className="absolute top-14 left-4 z-60 w-76 max-w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-xl animate-in fade-in zoom-in-95 duration-100 sm:top-16 sm:left-5">
              <div className="max-h-72 overflow-y-auto p-1.5">
                {isMentionLoading ? (
                  <div className="flex items-center justify-center gap-2 p-4 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  mentionResults.map((user, index) => (
                    <div
                      key={user.id}
                      onClick={() => onInsertMention(user.username)}
                      onMouseEnter={() => onActiveIndexChange(index)}
                      className={`relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors ${
                        index === activeIndex
                          ? "bg-blue-50 text-blue-700"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <Avatar data={user} className="h-8 w-8 sm:h-8 sm:w-8" />
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
  );
}
