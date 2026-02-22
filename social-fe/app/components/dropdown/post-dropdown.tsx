import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookA,
  Copy,
  Funnel,
  MoreHorizontal,
  Pin,
  Settings,
  Trash,
  VolumeOff,
  Loader2,
} from "lucide-react";
import { usePost } from "@/app/hooks/use-post";
import { Feed } from "@/app/interfaces/feed.interface";
import { useAuth } from "@/app/hooks/use-auth";

interface PostDropDownProps {
  post: Feed;
}

interface DropdownItem {
  id: number;
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function PostDropDown({ post }: PostDropDownProps) {
  const { deletePost, isDeletingPost } = usePost();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOwner = user?.id === post?.user?.id;

  const baseItems: DropdownItem[] = [
    { id: 1, title: "Pin to your profile", icon: <Pin size={18} /> },
    { id: 2, title: "Translate", icon: <BookA size={18} /> },
    { id: 3, title: "Copy post text", icon: <Copy size={18} /> },
    { id: 4, title: "Mute thread", icon: <VolumeOff size={18} /> },
    { id: 5, title: "Mute words & tags", icon: <Funnel size={18} /> },
    { id: 6, title: "Edit interaction settings", icon: <Settings size={18} /> },
  ];

  const dropdownItems = isOwner
    ? [
        ...baseItems,
        {
          id: 7,
          title: "Delete post",
          icon: <Trash size={18} />,
          onClick: () => setIsModalOpen(true),
          className: "text-red-600 focus:text-red-700 focus:bg-red-50",
        },
      ]
    : baseItems;

  const confirmDelete = () => {
    deletePost.mutate(post.id, {
      onSettled: () => {
        setIsModalOpen(false);
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors">
          <MoreHorizontal size={18} strokeWidth={2.2} />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-60 p-1 text-[#111827]">
          <DropdownMenuGroup>
            {dropdownItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <DropdownMenuItem
                  className={`flex cursor-pointer items-center justify-between py-2.5 font-medium ${item.className || ""}`}
                  onClick={item.onClick ? item.onClick : undefined}
                >
                  <span>{item.title}</span>
                  <span className={item.className ? "" : "text-slate-600"}>
                    {item.icon}
                  </span>
                </DropdownMenuItem>

                {(index === 0 || index === 2 || index === 4) && (
                  <DropdownMenuSeparator className="my-1" />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm Delete Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[320px] rounded-[32px] bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Delete this post?
            </h2>
            <p className="text-[15px] leading-snug text-gray-600 mb-6">
              If you remove this post, you won't be able to recover it.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDelete}
                disabled={isDeletingPost}
                className="flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeletingPost ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeletingPost}
                className="flex w-full items-center justify-center rounded-full bg-[#F1F5F9] py-3.5 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#e2e8f0] disabled:opacity-70"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
