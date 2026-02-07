import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinLRIDS = () => {
  if (socket) {
    socket.emit('join-lrids');
  }
};

export const joinReception = () => {
  if (socket) {
    socket.emit('join-reception');
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};