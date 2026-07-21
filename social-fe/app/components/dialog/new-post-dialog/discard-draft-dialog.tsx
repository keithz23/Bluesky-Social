import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type DiscardDraftDialogProps = {
  open: boolean;
  title?: string;
  description?: string;
  showFootnote?: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

export function DiscardDraftDialog({
  open,
  title = "Discard draft?",
  description = "Your post has unsaved changes.",
  showFootnote = true,
  onOpenChange,
  onDiscard,
}: DiscardDraftDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-100 w-[calc(100vw-2rem)] max-w-90 gap-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-4">
          <div>
            <DialogTitle className="text-[17px] font-bold text-slate-950">
              {title}
            </DialogTitle>
            <p className="mt-1.5 text-sm leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:grid sm:grid-cols-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>

            <button
              onClick={onDiscard}
              className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-[#E42240] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#c91d37]"
            >
              Discard
            </button>
          </div>

          {showFootnote && (
            <p className="text-center text-xs leading-4 text-slate-400">
              This action cannot be undone.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
