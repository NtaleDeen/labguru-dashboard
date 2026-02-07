import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initializeSocket = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on('join-lrids', () => {
      socket.join('lrids');
      console.log('Client joined LRIDS room');
    });

    socket.on('join-reception', () => {
      socket.join('reception');
      console.log('Client joined reception room');
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const emitToLRIDS = (event: string, data: any) => {
  if (io) {
    io.to('lrids').emit(event, data);
  }
};

export const emitToReception = (event: string, data: any) => {
  if (io) {
    io.to('reception').emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};