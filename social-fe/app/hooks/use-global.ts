import { useSocket } from "@/providers/socket.provider";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useGlobal = () => {
  const { globalSocket, isConnected } = useSocket();
  const qc = useQueryClient();
  const [hasNewPosts, setHasNewPosts] = useState(false);

  useEffect(() => {
    if (!globalSocket || !isConnected) return;

    const handlePostCreate = () => {
      setHasNewPosts(true);
    };

    globalSocket.on("Post_create", handlePostCreate);

    return () => {
      globalSocket.off("Post_create", handlePostCreate);
    };
  }, [globalSocket, isConnected]);

  const refreshFeed = () => {
    setHasNewPosts(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    qc.resetQueries({ queryKey: ["feed"], exact: true });
  };

  return { hasNewPosts, refreshFeed };
};
