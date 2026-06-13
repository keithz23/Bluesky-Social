"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, Pencil, Trash, Loader2, MoreHorizontal } from "lucide-react";
import { useAuth } from "@/app/hooks/use-auth";

interface ListDropdownProps {
  list: any;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

export default function ListDropdown({
  list,
  onEditClick,
  onDeleteClick,
}: ListDropdownProps) {
  const { user } = useAuth();

  const isOwner = user?.id === list?.userId;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/profile/${list.user.username}/lists/${list.id}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none cursor-pointer p-2 rounded-full hover:bg-slate-100 transition-colors">
          <MoreHorizontal className="text-gray-600 w-5 h-5" strokeWidth={2.2} />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56 p-1 text-[#111827] rounded-xl shadow-lg border-gray-100 right-0">
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex cursor-pointer items-center justify-between py-2.5 px-3 font-medium text-[15px] hover:bg-gray-50 rounded-md transition-colors"
              onClick={handleCopyLink}
            >
              <span>Copy link to list</span>
              <Link2 size={18} className="text-gray-600" />
            </DropdownMenuItem>

            {isOwner && (
              <>
                <DropdownMenuSeparator className="my-1 bg-gray-100" />

                {/* 2. Edit list */}
                <DropdownMenuItem
                  className="flex cursor-pointer items-center justify-between py-2.5 px-3 font-medium text-[15px] hover:bg-gray-50 rounded-md transition-colors"
                  onClick={onEditClick}
                >
                  <span>Edit list details</span>
                  <Pencil size={18} className="text-gray-600" />
                </DropdownMenuItem>

                {/* 3. Delete list */}
                <DropdownMenuItem
                  className="flex cursor-pointer items-center justify-between py-2.5 px-3 font-medium text-[15px] hover:bg-gray-50 rounded-md transition-colors"
                  onClick={onDeleteClick}
                >
                  <span>Delete list</span>
                  <Trash size={18} className="text-gray-600" />
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
