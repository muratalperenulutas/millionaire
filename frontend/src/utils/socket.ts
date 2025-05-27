import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (): Socket => {
  if (!socket) {
    const adapterUrl = process.env.NEXT_PUBLIC_ADAPTER_URL || 'http://localhost:3001';
    console.log(`Connecting to WebSocket adapter at: ${adapterUrl}`);
    socket = io(adapterUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true
    });
    console.log('Socket initialized and connected to server');

  }
  
  return socket;
};