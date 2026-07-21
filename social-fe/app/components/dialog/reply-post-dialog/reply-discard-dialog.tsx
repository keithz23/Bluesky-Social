import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type ReplyDiscardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
};

export function ReplyDiscardDialog({
  open,
  onOpenChange,
  onDiscard,
}: ReplyDiscardDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-62.5 rounded-[32px] bg-white p-6 shadow-xl border-none gap-0 z-100 [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">Discard reply</DialogTitle>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Discard reply?
          </h2>
          <p className="text-[15px] leading-snug text-gray-600 mb-6">
            This can&apos;t be undone and you&apos;ll lose your draft.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onDiscard}
              className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37]"
            >
              Discard
            </button>

            <button
              onClick={() => onOpenChange(false)}
              className="cursor-pointer flex w-full items-center justify-center rounded-full bg-[#F1F5F9] py-3.5 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#e2e8f0]"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
