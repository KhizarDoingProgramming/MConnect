import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@mconnect/shared';
import { SOCKET_URL, getAuthToken } from '../lib/api';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const useSocket = () => {
  const [socket, setSocket] = useState<AppSocket | null>(null);

  useEffect(() => {
    let socketInstance: AppSocket | null = null;

    const token = getAuthToken();
    
    if (!token) {
      return;
    }

    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    setSocket(socketInstance);

    return () => {
      socketInstance?.disconnect();
    };
  }, []);

  return socket;
};
