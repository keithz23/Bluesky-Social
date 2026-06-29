"use client";
import SavedPostCard from "@/app/components/card/save-post-card";
import { PostSkeletonList } from "@/app/components/skeletons";
import { useGetBookmarks } from "@/app/hooks/use-bookmark";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SavedPostsPage() {
  const router = useRouter();
  const { data: bookmarks = [], isLoading } = useGetBookmarks();

  return (
    <div className="flex min-h-[calc(100dvh-7rem)] w-full flex-col bg-white pb-20 lg:min-h-[calc(100dvh-3.5rem)]">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center p-4 lg:top-14">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Saved Posts</h1>
      </div>

      {/* Loading */}
      {isLoading && <PostSkeletonList avatarSize="h-12 w-12" />}

      {/* Empty state */}
      {!isLoading && bookmarks.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-24 px-4 text-center">
          <Bookmark className="w-12 h-12 text-gray-300 mb-4" />
          <p className="font-bold text-gray-900 text-lg">No saved posts yet</p>
          <p className="text-gray-500 text-sm mt-1">
            Posts you save will appear here
          </p>
        </div>
      )}

      {/* Posts */}
      <div className="flex flex-col">
        {bookmarks.map((bookmark: any) => (
          <SavedPostCard key={bookmark.post.id} bookmark={bookmark} />
        ))}
      </div>
    </div>
  );
}
