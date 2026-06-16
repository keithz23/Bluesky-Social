import { useSocket } from "@/providers/socket.provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "./use-auth";
import {
  extractCreatedPost,
  prependPostToFeedCache,
  prependPostToUserPostCaches,
} from "../utils/post-cache.util";

export const useGlobal = () => {
  const { globalSocket, isConnected } = useSocket();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [hasNewPosts, setHasNewPosts] = useState(false);

  useEffect(() => {
    if (!globalSocket || !isConnected) return;

    const handlePostCreate = (payload?: unknown) => {
      const post = extractCreatedPost(payload);

      if (!post) {
        setHasNewPosts(true);
        qc.invalidateQueries({ queryKey: ["feed"] });
        qc.invalidateQueries({ queryKey: ["userPosts"] });
        return;
      }

      const isOwnPost = post.userId === user?.id || post.user?.id === user?.id;

      prependPostToUserPostCaches(qc, post);

      if (isOwnPost) {
        prependPostToFeedCache(qc, post);
        setHasNewPosts(false);
      } else {
        setHasNewPosts(true);
      }

      qc.invalidateQueries({ queryKey: ["userPosts"] });
    };

    globalSocket.on("Post_create", handlePostCreate);

    return () => {
      globalSocket.off("Post_create", handlePostCreate);
    };
  }, [globalSocket, isConnected, qc, user?.id]);

  const refreshFeed = () => {
    setHasNewPosts(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    qc.resetQueries({ queryKey: ["feed"], exact: true });
  };

  return { hasNewPosts, refreshFeed };
};
