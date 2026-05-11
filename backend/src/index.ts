import { createServer } from 'http';
import dotenv from 'dotenv';
import app from './app';
import { createLogger } from './lib/logger';
import { registerRealtimeHandlers } from './realtime/roomState';
import { initializeSocket } from './socket';

dotenv.config();

const logger = createLogger('server');

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    process.exit(1);
});

const httpServer = createServer(app);

const port = Number(process.env.PORT) || 8080;

// Log environment and port
console.log(`[SERVER] Starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`[SERVER] PORT set to ${port}`);

// Initialize both sets of socket handlers
logger.info('Initializing socket IO...');
const io = initializeSocket(httpServer);
logger.info('Registering realtime handlers...');
registerRealtimeHandlers(io);

logger.info('Starting HTTP server...');
httpServer.listen(port, '0.0.0.0', () => {
    logger.info('Server is running', { port, host: '0.0.0.0' });
}).on('error', (err) => {
    logger.error('Server failed to start', { err });
});

export default app;
