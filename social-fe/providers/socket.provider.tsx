"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
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

interface Sockets {
  global: Socket | null;
  notifications: Socket | null;
  chat: Socket | null;
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

  const [sockets, setSockets] = useState<Sockets>({
    global: null,
    notifications: null,
    chat: null,
  });

  const [isConnected, setIsConnected] = useState(false);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId || !accessToken) {
      return;
    }

    if (isInitialized.current) {
      return;
    }

    let globalIo: Socket | null = null;
    let notiIo: Socket | null = null;
    let chatIo: Socket | null = null;

    let cancelled = false;

    const initSocket = async () => {
      try {
        isInitialized.current = true;

        const { token } = await AuthService.getSocketToken();

        if (cancelled) {
          isInitialized.current = false;
          return;
        }

        const commonOptions = {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
        };

        globalIo = io(`${SERVER_URL}/socket`, commonOptions);
        notiIo = io(`${SERVER_URL}/notifications`, commonOptions);
        chatIo = io(`${SERVER_URL}/chat`, commonOptions);

        globalIo.on("connect", () => {
          setIsConnected(true);
        });

        globalIo.on("disconnect", () => {
          setIsConnected(false);
        });

        globalIo.on("connect_error", async (err) => {
          console.error("Global Socket Error:", err);

          try {
            const { token: refreshedToken } =
              await AuthService.getSocketToken();

            if (cancelled) {
              return;
            }

            [globalIo, notiIo, chatIo].forEach((socket) => {
              if (!socket) return;

              socket.auth = {
                token: refreshedToken,
              };

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
      cancelled = true;

      globalIo?.disconnect();
      notiIo?.disconnect();
      chatIo?.disconnect();

      isInitialized.current = false;
    };
  }, [userId, accessToken]);

  const isAuthenticated = Boolean(userId && accessToken);

  return (
    <SocketContext.Provider
      value={{
        globalSocket: isAuthenticated ? sockets.global : null,
        notificationsSocket: isAuthenticated ? sockets.notifications : null,
        chatSocket: isAuthenticated ? sockets.chat : null,
        isConnected: isAuthenticated ? isConnected : false,
      }}
    >
      <GlobalSocketWrapper>{children}</GlobalSocketWrapper>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
