"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { AuthService } from "@/app/services/auth.service";
import { useGlobal } from "@/app/hooks/use-global";
import { useChatRealtime } from "@/app/hooks/use-chat-realtime";
import { useAuthStore } from "@/app/store/use-auth.store";

interface SocketContextType {
  globalSocket: Socket | null;
  notificationsSocket: Socket | null;
  chatSocket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  globalSocket: null,
  notificationsSocket: null,
  chatSocket: null,
  isConnected: false,
});

const GlobalSocketWrapper = ({ children }: { children: React.ReactNode }) => {
  useGlobal();
  useChatRealtime();
  return <>{children}</>;
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const userId = useAuthStore((state) => state.id);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [sockets, setSockets] = useState<{
    global: Socket | null;
    notifications: Socket | null;
    chat: Socket | null;
  }>({
    global: null,
    notifications: null,
    chat: null,
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId || !accessToken) {
      setSockets((current) => {
        current.global?.disconnect();
        current.notifications?.disconnect();
        current.chat?.disconnect();
        return { global: null, notifications: null, chat: null };
      });
      setIsConnected(false);
      return;
    }

    if (isInitialized.current) return;

    let globalIo: Socket;
    let notiIo: Socket;
    let chatIo: Socket;

    const initSocket = async () => {
      try {
        isInitialized.current = true;

        const { token } = await AuthService.getSocketToken();

        const commonOptions = {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
        };

        globalIo = io(`${SERVER_URL}/socket`, commonOptions);
        notiIo = io(`${SERVER_URL}/notifications`, commonOptions);
        chatIo = io(`${SERVER_URL}/chat`, commonOptions);

        globalIo.on("connect", () => setIsConnected(true));
        globalIo.on("disconnect", () => setIsConnected(false));
        globalIo.on("connect_error", async (err) => {
          console.error("Global Socket Error:", err);
          try {
            const { token: refreshedToken } = await AuthService.getSocketToken();
            [globalIo, notiIo, chatIo].forEach((socket) => {
              socket.auth = { token: refreshedToken };
              socket.connect();
            });
          } catch (refreshError) {
            console.error("Refresh socket token failed:", refreshError);
          }
        });

        setSockets({
          global: globalIo,
          notifications: notiIo,
          chat: chatIo,
        });
      } catch (error) {
        console.error("Get socket token failed:", error);
        isInitialized.current = false;
      }
    };

    initSocket();

    return () => {
      if (globalIo) globalIo.disconnect();
      if (notiIo) notiIo.disconnect();
      if (chatIo) chatIo.disconnect();
      isInitialized.current = false;
    };
  }, [userId, accessToken]);

  return (
    <SocketContext.Provider
      value={{
        globalSocket: sockets.global,
        notificationsSocket: sockets.notifications,
        chatSocket: sockets.chat,
        isConnected,
      }}
    >
      <GlobalSocketWrapper>{children}</GlobalSocketWrapper>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
