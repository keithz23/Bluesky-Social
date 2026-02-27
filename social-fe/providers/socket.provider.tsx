"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "@/app/constants/endpoint.constant";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

let globalSocket: Socket | null = null;

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(globalSocket);
  const [isConnected, setIsConnected] = useState<boolean>(
    globalSocket?.connected || false,
  );

  useEffect(() => {
    if (globalSocket) {
      return;
    }

    const initSocket = async () => {
      try {
        const { data } = await axiosInstance.get(
          API_ENDPOINT.AUTH.SOCKET_TOKEN,
        );

        globalSocket = io(`${process.env.NEXT_PUBLIC_SERVER_URL}/socket`, {
          auth: { token: data.token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionAttempts: 5,
        });

        globalSocket.on("connect", () => {
          setIsConnected(true);
        });

        globalSocket.on("disconnect", (reason) => {
          setIsConnected(false);
        });

        globalSocket.on("connect_error", (err) => {});

        setSocket(globalSocket);
      } catch (error) {
        console.error("Lỗi khi lấy socket token:", error);
      }
    };

    initSocket();

    return () => {};
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
