import { ReplyType } from "@/app/interfaces/post.interface";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Check, ChevronDown, ChevronUp, Quote, X } from "lucide-react";
import { CustomReplySettings } from "./types";

type PostPrivacyDialogProps = {
  open: boolean;
  replyType: ReplyType;
  customSettings: CustomReplySettings;
  allowQuote: boolean;
  saveForNextTime: boolean;
  isListsExpanded: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectReplyType: (type: ReplyType) => void;
  onToggleCustom: (key: keyof CustomReplySettings) => void;
  onToggleAllowQuote: () => void;
  onToggleSaveForNextTime: () => void;
  onToggleListsExpanded: () => void;
};

const CUSTOM_OPTIONS: Array<{
  id: keyof CustomReplySettings;
  label: string;
}> = [
  { id: "followers", label: "Your followers" },
  { id: "following", label: "People you follow" },
  { id: "mentioned", label: "People you mention" },
];

export function PostPrivacyDialog({
  open,
  replyType,
  customSettings,
  allowQuote,
  saveForNextTime,
  isListsExpanded,
  onOpenChange,
  onSelectReplyType,
  onToggleCustom,
  onToggleAllowQuote,
  onToggleSaveForNextTime,
  onToggleListsExpanded,
}: PostPrivacyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-privacy-dialog="true"
        showCloseButton={false}
        className="max-w-100 p-6 border-none rounded-xl shadow-xl bg-white gap-0"
      >
        <DialogTitle className="flex justify-between items-center mb-4 text-xl font-bold text-black">
          Post interaction settings
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogTitle>

        <p className="text-sm font-semibold mb-3">Who can reply</p>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <ReplyTypeOption
              active={replyType === "anyone"}
              label="Anyone"
              onClick={() => onSelectReplyType("anyone")}
            />
            <ReplyTypeOption
              active={replyType === "nobody"}
              label="Nobody"
              onClick={() => onSelectReplyType("nobody")}
            />
          </div>

          {CUSTOM_OPTIONS.map((item) => {
            const isActive = customSettings[item.id];
            return (
              <div
                key={item.id}
                onClick={() => onToggleCustom(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[#EAF2FF] text-black"
                    : "bg-[#F2F4F8] text-[#444746]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center border-[1.5px] ${
                    isActive
                      ? "border-[#0066FF] bg-[#0066FF]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isActive && (
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  )}
                </div>
                <span className="text-[15px] font-medium">{item.label}</span>
              </div>
            );
          })}

          <div className="bg-[#F2F4F8] rounded-xl overflow-hidden mt-1">
            <div
              onClick={onToggleListsExpanded}
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
                You don&apos;t have any lists yet.
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
              onClick={onToggleAllowQuote}
              className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors flex items-center ${
                allowQuote ? "bg-[#0066FF] justify-end" : "bg-gray-400 justify-start"
              }`}
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
              onClick={onToggleSaveForNextTime}
              className="flex items-center gap-2 cursor-pointer text-black"
            >
              <div
                className={`w-4 h-4 rounded-[3px] flex items-center justify-center border-[1.5px] ${
                  saveForNextTime
                    ? "border-[#0066FF] bg-[#0066FF]"
                    : "border-gray-300 bg-white"
                }`}
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
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-full bg-[#0066FF] hover:bg-blue-700 text-white font-bold text-[16px] shadow-none"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReplyTypeOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex-1 flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
        active ? "bg-[#EAF2FF] text-black" : "bg-[#F2F4F8] text-[#444746]"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.5px] ${
          active
            ? "border-[#0066FF] bg-[#0066FF]"
            : "border-gray-300 bg-white"
        }`}
      >
        {active && <div className="w-2 h-2 rounded-full bg-white"></div>}
      </div>
      <span className="text-[15px] font-medium">{label}</span>
    </div>
  );
}
