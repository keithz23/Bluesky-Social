"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/app/constants/endpoint.constant";
import { useGlobal } from "@/app/hooks/use-global";

interface SocketContextType {
  globalSocket: Socket | null;
  notificationsSocket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  globalSocket: null,
  notificationsSocket: null,
  isConnected: false,
});

const GlobalSocketWrapper = ({ children }: { children: React.ReactNode }) => {
  useGlobal();
  return <>{children}</>;
};

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [sockets, setSockets] = useState<{
    global: Socket | null;
    notifications: Socket | null;
  }>({
    global: null,
    notifications: null,
  });

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    let globalIo: Socket;
    let notiIo: Socket;

    const initSocket = async () => {
      try {
        isInitialized.current = true;

        const { data } = await axiosInstance.get(
          API_ENDPOINT.AUTH.SOCKET_TOKEN,
        );
        const token = data.token;

        const commonOptions = {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
        };

        globalIo = io(`${SERVER_URL}/socket`, commonOptions);
        notiIo = io(`${SERVER_URL}/notifications`, commonOptions);

        globalIo.on("connect", () => setIsConnected(true));
        globalIo.on("disconnect", () => setIsConnected(false));
        globalIo.on("connect_error", (err) =>
          console.error("Global Socket Error:", err),
        );

        setSockets({
          global: globalIo,
          notifications: notiIo,
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
      isInitialized.current = false;
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        globalSocket: sockets.global,
        notificationsSocket: sockets.notifications,
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
