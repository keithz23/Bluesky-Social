import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/socket.provider";

export const useNotifications = () => {
  const { socket, isConnected } = useSocket();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotification = (data: any) => {
      qc.setQueryData(["notifications"], (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) return old;

        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              notifications: [data, ...old.pages[0].notifications],
            },
            ...old.pages.slice(1),
          ],
        };
      });
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, [socket, isConnected, qc]);
};
