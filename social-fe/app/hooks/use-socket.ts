import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { AuthService } from "../services/auth.service";
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
    AuthService.getSocketToken().then(({ token }) => {
      if (!isMounted) return;
      globalToken = token;
      const s = getSocket(token);
      if (!s.connected) s.connect();
      setSocket(s);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return socket;
};
