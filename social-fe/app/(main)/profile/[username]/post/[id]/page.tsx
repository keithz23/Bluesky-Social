"use client";
import PostDetailCard from "@/app/components/card/post-detail-card";
import { useGetPostById } from "@/app/hooks/use-post";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: post, isLoading } = useGetPostById(id);

  return (
    <>
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center p-2">
        <button
          onClick={() => router.back()}
          className="p-2 mr-4 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <div className="flex flex-col">
          <p className="font-bold">Post</p>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="p-4 animate-pulse flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      )}

      {/* Post detail */}
      {post && <PostDetailCard post={post} />}
    </>
  );
}
