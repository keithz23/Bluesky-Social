import { ReplyType } from "@/app/interfaces/post.interface";
import { User } from "@/app/interfaces/user.interface";
import { ChevronDown, Globe } from "lucide-react";
import type React from "react";
import Avatar from "../../avatar";

type PostAuthorRowProps = {
  user?: User | null;
  replyType: ReplyType;
  onOpenPrivacySettings: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function PostAuthorRow({
  user,
  replyType,
  onOpenPrivacySettings,
}: PostAuthorRowProps) {
  return (
    <div className="flex gap-2 p-3">
      {user ? (
        <Avatar data={user} className="h-11 w-11 sm:h-11 sm:w-11" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF4F5A] text-lg font-bold text-white">
          @
        </div>
      )}
      <div className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950">
          {user?.displayName || user?.username}
        </span>
        <div className="mt-1">
          <button
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onOpenPrivacySettings}
            className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
          >
            <Globe className="h-4 w-4" strokeWidth={2} />
            {replyType === "anyone"
              ? "Anyone can interact"
              : replyType === "nobody"
                ? "Nobody can reply"
                : "Custom interactions"}
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
