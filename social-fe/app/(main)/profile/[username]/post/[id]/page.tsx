"use client";
import PostDetailCard from "@/app/components/card/post-detail-card";
import ReplyCard from "@/app/components/card/reply-card";
import ReplyPostModal from "@/app/components/dialog/reply-post-dialog";
import { useAuth } from "@/app/hooks/use-auth";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useGetPostById } from "@/app/hooks/use-post";
import { useReplies } from "@/app/hooks/use-reply";
import { checkCanReply } from "@/app/utils/check.util";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

export default function PostDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: post, isLoading } = useGetPostById(id);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReplies(id);
  const replies = data?.pages.flatMap((page) => page.replies) ?? [];

  const { ref } = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    enabled: replies.length > 0,
  });

  const disableReply = post ? !checkCanReply(post, user) : false;

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
            <div className="h-4 bg-gray-200 rounded w-full" />a
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      )}

      {/* Post detail */}
      {post && (
        <PostDetailCard post={post} role="main" disabled={disableReply} />
      )}

      {post && (
        <div className="w-full border-y">
          <ReplyPostModal
            post={post}
            type="avatar-with-input"
            disabled={disableReply}
          />
        </div>
      )}

      <div className="flex flex-col">
        {replies.map((reply) => (
          <ReplyCard key={reply.id} reply={reply} disabled={disableReply} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={ref} className="py-4 text-center text-sm text-gray-400">
        {isFetchingNextPage ? "Loading more..." : null}
      </div>
    </>
  );
}
