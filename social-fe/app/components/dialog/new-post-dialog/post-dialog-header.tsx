import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { SubmitButtonProps } from "./types";

type PostDialogHeaderProps = SubmitButtonProps & {
  title?: string;
  submitLabel?: string;
  closeLabel?: string;
  onCancel: () => void;
};

export function PostDialogHeader({
  isPending,
  isSubmitDisabled,
  title = "Create post",
  submitLabel = "Post",
  closeLabel = "Close post dialog",
  onCancel,
  onSubmit,
}: PostDialogHeaderProps) {
  return (
    <div className="sticky top-0 z-20 grid h-14 grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-slate-100 bg-white/95 px-4 backdrop-blur">
      <button
        onClick={onCancel}
        aria-label={closeLabel}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100"
      >
        <X className="h-5 w-5" />
      </button>
      <h2 className="justify-self-center text-base font-bold text-slate-950">
        {title}
      </h2>
      <Button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className={`hidden h-9 rounded-full px-5 text-sm font-bold shadow-none transition-colors sm:inline-flex ${
          !isSubmitDisabled
            ? "cursor-pointer bg-[#0066FF] text-white hover:bg-blue-700"
            : "cursor-not-allowed bg-[#A2C7FF] text-white hover:bg-[#A2C7FF]"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          submitLabel
        )}
      </Button>
    </div>
  );
}
