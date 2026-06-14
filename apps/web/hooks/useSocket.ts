import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@mconnect/shared';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocket = () => {
  const [socket, setSocket] = useState<AppSocket | null>(null);

  useEffect(() => {
    let socketInstance: AppSocket | null = null;
    let cancelled = false;

    const connect = async () => {
      let token: string | undefined;

      try {
        const res = await fetch('/api/auth/socket-token');
        if (res.ok) {
          const data = await res.json();
          token = data.token;
        }
      } catch {
        // Local development can still rely on same-origin cookies.
      }

      if (cancelled) return;

      socketInstance = io(SOCKET_URL, {
        auth: token ? { token } : undefined,
        withCredentials: true,
        transports: ['websocket'],
      });

      setSocket(socketInstance);
    };

    connect();

    return () => {
      cancelled = true;
      socketInstance?.disconnect();
    };
  }, []);

  return socket;
};
