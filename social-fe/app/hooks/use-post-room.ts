import { useEffect } from "react";
import { useSocket } from "@/providers/socket.provider";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Joins a post room via the global socket so the current user
 * receives real-time replies/updates for this post.
 * Automatically leaves the room on unmount.
 */
export const usePostRoom = (postId: string | undefined) => {
  const { globalSocket, isConnected } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!globalSocket || !isConnected || !postId) return;

    // Join the post room
    globalSocket.emit("join-post", { postId });

    // Listen for new replies broadcast to this post room
    const handleNewReply = () => {
      qc.invalidateQueries({ queryKey: ["replies", postId] });
      qc.invalidateQueries({ queryKey: ["post-detail", postId] });
    };

    globalSocket.on("new-reply", handleNewReply);

    return () => {
      globalSocket.emit("leave-post", { postId });
      globalSocket.off("new-reply", handleNewReply);
    };
  }, [globalSocket, isConnected, postId, qc]);
};
