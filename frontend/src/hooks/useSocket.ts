import { useEffect } from 'react';
import { useSocket as useSocketContext } from '../contexts/SocketContext';

export const useSocket = (event: string, callback: (data: any) => void) => {
  const { socket, isConnected } = useSocketContext();

  useEffect(() => {
    if (socket && isConnected) {
      socket.on(event, callback);

      return () => {
        socket.off(event, callback);
      };
    }
  }, [socket, isConnected, event, callback]);

  return { socket, isConnected };
};