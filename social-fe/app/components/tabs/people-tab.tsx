import { UserPlus, BadgeCheck, Loader2 } from "lucide-react";
import AddPeopleDialog from "@/app/components/dialog/add-people-dialog";
import Avatar from "../avatar";

interface PeopleTabProps {
  listId: string;
  members: any[];
  isOwner: boolean;
  scrollRef: any;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
}

export default function PeopleTab({
  listId,
  members,
  isOwner,
  scrollRef,
  isFetchingNextPage,
  hasNextPage,
}: PeopleTabProps) {
  return (
    <div className="flex flex-col w-full pb-20">
      {isOwner && (
        <div className="flex justify-end px-4 py-3 border-b border-gray-100">
          <AddPeopleDialog listId={listId} currentMembers={members}>
            <button className="flex items-center gap-1.5 text-[#1185fe] hover:text-[#0a70db] font-medium text-[15px] transition-colors cursor-pointer px-2 py-1 hover:bg-blue-50 rounded-md">
              <UserPlus className="w-4.5 h-4.5" strokeWidth={2.5} />
              Add people
            </button>
          </AddPeopleDialog>
        </div>
      )}

      {members.map((member) => {
        const user = member.user;

        return (
          <div
            key={member.id}
            className="flex flex-col px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar data={user} />

                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[15px] text-gray-900 truncate">
                      {user.displayName || user.username}
                    </span>
                    {user.verified && (
                      <BadgeCheck className="w-4.5 h-4.5 text-[#1185fe] shrink-0" />
                    )}
                  </div>
                  <span className="text-[15px] text-gray-500 truncate">
                    @{user.username}
                  </span>
                </div>
              </div>

              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="shrink-0 ml-3 px-4 py-1.5 rounded-full text-[14px] font-semibold bg-[#F1F5F9] text-[#334155] hover:bg-[#e2e8f0] transition-colors cursor-pointer"
                >
                  Edit
                </button>
              )}
            </div>

            {user.bio && (
              <div className="mt-2 text-[15px] text-gray-900 leading-[1.3] whitespace-pre-wrap word-break">
                {user.bio}
              </div>
            )}
          </div>
        );
      })}

      {hasNextPage && (
        <div
          ref={scrollRef}
          className="h-14 flex items-center justify-center mt-2"
        >
          {isFetchingNextPage && (
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
