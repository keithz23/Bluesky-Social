"use client";

import { useState } from "react";
import { ArrowLeft, Pin, Hash, Users, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useGetListById, useLists } from "@/app/hooks/use-list";
import { useAuth } from "@/app/hooks/use-auth";
import Loading from "@/app/components/loading";
import ListDropdown from "@/app/components/dropdown/list-dropdown";
import ListFormDialog from "@/app/components/dialog/list-dialog";
import AddPeopleDialog from "@/app/components/dialog/add-people-dialog";
import { useGetListMembers } from "@/app/hooks/use-list-member";
import PeopleTab from "@/app/components/tabs/people-tab";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";

export default function ListDetailPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "people">("posts");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGetListById(id);
  const { deleteMutation, isDeleting } = useLists();

  const list = data?.data;

  const {
    data: membersData,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isLoading: isFetchingMemberlist,
  } = useGetListMembers(id);

  const isOwner = list
    ? user?.id === list.userId
      ? "List by you"
      : `List by ${list.user?.username || "Unknown"}`
    : "";

  const currentListMembers =
    membersData?.pages.flatMap((page) => page.members) || [];

  const confirmDelete = () => {
    if (!list) return;
    deleteMutation.mutate(list.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        router.push("/lists");
      },
    });
  };

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: currentListMembers.length > 0,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!list) return null;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-white pb-20 relative">
        {/* --- HEADER --- */}
        <div className="sticky top-0 z-50 h-14 bg-white/90 backdrop-blur-md flex items-center justify-between px-4 border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-full font-bold text-[14px] transition-colors cursor-pointer">
              <Pin className="w-4 h-4" />
              Pin to home
            </button>

            <ListDropdown
              list={list}
              onEditClick={() => setIsEditDialogOpen(true)}
              onDeleteClick={() => setIsDeleteDialogOpen(true)}
            />
          </div>
        </div>

        {/* --- LIST INFO --- */}
        <div className="px-4 py-2 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {list.listPhoto ? (
              <div className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center overflow-hidden bg-gray-100">
                <img
                  src={list.listPhoto}
                  alt={list.name || "list photo"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 shrink-0 bg-[#1185fe] rounded-xl flex items-center justify-center overflow-hidden">
                <Users className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
            )}

            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
                {list.name}
              </h1>
              <p className="text-[15px] text-gray-500 leading-tight mt-0.5">
                {isOwner}
              </p>
            </div>
          </div>

          {list.description && (
            <p className="text-[15px] text-gray-900 whitespace-pre-wrap">
              {list.description}
            </p>
          )}
        </div>

        {/* --- TABS NAV --- */}
        <div className="sticky top-14 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 flex mt-2">
          <button
            onClick={() => setActiveTab("posts")}
            className="flex-1 flex items-center justify-center h-12 relative hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span
              className={`text-[15px] ${activeTab === "posts" ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}
            >
              Posts
            </span>
            {activeTab === "posts" && (
              <div className="absolute bottom-0 h-1 w-14 bg-[#1185fe] rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("people")}
            className="flex-1 flex items-center justify-center h-12 relative hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span
              className={`text-[15px] ${activeTab === "people" ? "font-bold text-gray-900" : "font-medium text-gray-500"}`}
            >
              People
            </span>
            {activeTab === "people" && (
              <div className="absolute bottom-0 h-1 w-14 bg-[#1185fe] rounded-t-full" />
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center">
          {/* TAB POSTS */}
          {activeTab === "posts" && (
            <div className="w-full text-center py-20 text-gray-500">
              Posts feed coming soon...
            </div>
          )}

          {/* TAB PEOPLE */}
          {activeTab === "people" && (
            <>
              {isFetchingMemberlist && currentListMembers.length === 0 ? (
                <div className="py-20 flex justify-center w-full">
                  <Loader2 className="w-8 h-8 text-[#1185fe] animate-spin" />
                </div>
              ) : currentListMembers.length === 0 ? (
                <div className="pt-24 px-4 w-full">
                  <EmptyFeedState
                    listId={list.id}
                    currentListMembers={currentListMembers}
                  />
                </div>
              ) : (
                <PeopleTab
                  listId={list.id}
                  members={currentListMembers}
                  isOwner={user?.id === list.userId}
                  // --- TRUYỀN PROPS VÀO ĐÂY ---
                  scrollRef={ref}
                  isFetchingNextPage={isFetchingNextPage}
                  hasNextPage={hasNextPage || false}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      {isEditDialogOpen && (
        <ListFormDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          list={list}
        />
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-[320px] rounded-[32px] bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Delete this list?
            </h2>
            <p className="text-[15px] leading-snug text-gray-600 mb-6">
              If you remove this list, you won't be able to recover it.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex w-full items-center justify-center rounded-full bg-[#E42240] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#c91d37] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
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

function EmptyFeedState({
  listId,
  currentListMembers,
}: {
  listId: string;
  currentListMembers: any;
}) {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in duration-300">
      <div className="mb-4 text-gray-400">
        <Hash className="w-12 h-12" strokeWidth={1} />
      </div>
      <p className="text-[15px] text-gray-600 mb-6 font-medium">
        This feed is empty.
      </p>
      <AddPeopleDialog listId={listId} currentMembers={currentListMembers} />
    </div>
  );
}
