"use client";
import SavedPostCard from "@/app/components/card/save-post-card";
import { useGetBookmarks } from "@/app/hooks/use-bookmark";
import { ArrowLeft, Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedPostsPage() {
  const { data: bookmarks = [], isLoading } = useGetBookmarks();

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center p-4">
        <Link
          href="/"
          className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900 ml-4">Saved Posts</h1>
      </div>

      {/* Loading */}
      {isLoading &&
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-100 animate-pulse">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}

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
