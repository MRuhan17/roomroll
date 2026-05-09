import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './handlers';

let ioInstance: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
    ioInstance = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
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
