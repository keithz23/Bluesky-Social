import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type ReplyDialogHeaderProps = {
  isPending: boolean;
  isSubmitDisabled: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

export function ReplyDialogHeader({
  isPending,
  isSubmitDisabled,
  onCancel,
  onSubmit,
}: ReplyDialogHeaderProps) {
  return (
    <div className="flex justify-between items-center p-4">
      <button
        onClick={onCancel}
        className="text-[#0066FF] font-medium text-[15px] hover:underline cursor-pointer"
      >
        Cancel
      </button>
      <div className="flex items-center gap-6">
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className={`rounded-full font-bold px-5 h-9 shadow-none transition-colors ${
            !isSubmitDisabled
              ? "bg-[#0066FF] text-white hover:bg-blue-700 cursor-pointer"
              : "bg-[#A2C7FF] text-white cursor-not-allowed hover:bg-[#A2C7FF]"
          }`}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reply"}
        </Button>
      </div>
    </div>
  );
}
