import { MessageSquare } from "lucide-react";
import { User } from "@/app/interfaces/user.interface";

type ReplyDialogTriggerProps = {
  user?: User | null;
  type?: "avatar-with-input" | "icon" | "text";
  disabled?: boolean;
};

export function ReplyDialogTrigger({
  user,
  type,
  disabled,
}: ReplyDialogTriggerProps) {
  if (type === "avatar-with-input") {
    return (
      <button
        disabled={disabled}
        className={`flex items-center gap-x-3 p-2 w-full text-left rounded-full transition-colors ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-gray-200"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-[#FF4F5A] flex items-center justify-center text-sm text-white font-bold shrink-0 overflow-hidden">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          ) : (
            user?.username?.charAt(0).toUpperCase()
          )}
        </div>

        <span className="text-[15px] text-gray-500">Write your reply</span>
      </button>
    );
  }

  if (type === "text") {
    return (
      <button
        disabled={disabled}
        className={`text-[12px] font-semibold text-gray-500 transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:text-gray-900"
        }`}
      >
        Reply
      </button>
    );
  }

  return (
    <button
      disabled={disabled}
      className={`p-2 rounded-full transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "group-hover:bg-blue-50 cursor-pointer"
      }`}
    >
      <MessageSquare
        size={18}
        strokeWidth={2.2}
        className={`transition-colors ${
          disabled ? "text-gray-400" : "group-hover:text-blue-500 text-gray-500"
        }`}
      />
    </button>
  );
}
