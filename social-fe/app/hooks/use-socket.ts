import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { axiosInstance } from "@/lib/axios";
import { API_ENDPOINT } from "../constants/endpoint.constant";
import { Socket } from "socket.io-client";

let globalToken: string | null = null;

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (globalToken) {
      const s = getSocket(globalToken);
      if (!s.connected) s.connect();
      setSocket(s);
      return;
    }

    let isMounted = true;
    axiosInstance.get(API_ENDPOINT.AUTH.SOCKET_TOKEN).then(({ data }) => {
      if (!isMounted) return;
      globalToken = data.token;
      const s = getSocket(data.token);
      if (!s.connected) s.connect();
      setSocket(s);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return socket;
};
