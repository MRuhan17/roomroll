import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './handlers';
import { corsOptions } from '../config/cors';

let ioInstance: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
    ioInstance = new Server(httpServer, {
        cors: corsOptions,
        transports: ['websocket', 'polling'],
        pingInterval: 10000,
        pingTimeout: 5000,
        allowEIO3: true // Support older clients if needed
    });
    registerSocketHandlers(ioInstance);
    return ioInstance;
};

export const getIo = (): Server => {
    if (!ioInstance) {
        throw new Error('Socket.io not initialized');
    }
    return ioInstance;
};
