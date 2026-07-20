"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import ReplyCard from "@/app/components/card/reply-card";
import PostCommentsDialog from "@/app/components/dialog/post-comments-dialog";
import {
  InfiniteScrollFooter,
  PostSkeletonList,
} from "@/app/components/skeletons";
import { useInfiniteScroll } from "@/app/hooks/use-infinite-scroll";
import { useUserPosts } from "@/app/hooks/use-post";
import { Feed } from "@/app/interfaces/feed.interface";

export default function RepliesPage() {
  const { username } = useParams<{ username: string }>();
  const [selectedReply, setSelectedReply] = useState<Feed | null>(null);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useUserPosts(username, "replies");

  const replies =
    data?.pages.flatMap((page) => page.posts)?.filter(Boolean) ?? [];

  const { ref } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    enabled: replies.length > 0,
  });

  if (isLoading) {
    return <PostSkeletonList />;
  }

  if (replies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 pt-16 text-center">
        <MessageCircle
          className="mb-4 h-12 w-12 text-gray-400"
          strokeWidth={1.5}
        />
        <p className="font-bold text-gray-900">No replies yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Replies from this account will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {(replies as Feed[]).map((reply, index) => (
          <ReplyCard
            key={reply.id}
            reply={reply}
            isLastInThread={index === replies.length - 1}
            onClick={setSelectedReply}
          />
        ))}
      </div>

      {selectedReply && (
        <PostCommentsDialog
          post={selectedReply}
          open={!!selectedReply}
          onOpenChange={(open) => {
            if (!open) setSelectedReply(null);
          }}
          hideTrigger
        />
      )}

      <InfiniteScrollFooter
        refCallback={ref}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={hasNextPage}
        hasItems={replies.length > 0}
      />
    </>
  );
}
