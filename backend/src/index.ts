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

const port = Number(process.env.PORT) || 5000;

// Log environment and port
console.log(`[SERVER] Starting in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`[SERVER] PORT set to ${port}`);

// Initialize both sets of socket handlers
logger.info('Initializing socket IO...');
const io = initializeSocket(httpServer);
logger.info('Registering realtime handlers...');
registerRealtimeHandlers(io);

// Initialize weekly email chronicles background scheduler
logger.info('Initializing weekly email chronicles scheduler...');
const { sendWeeklyChronicles } = require('./services/emailService');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
setInterval(async () => {
    try {
        await sendWeeklyChronicles();
    } catch (err) {
        logger.error('Scheduled weekly email chronicles delivery failed:', { error: err });
    }
}, SEVEN_DAYS_MS);

// Run a background startup dry-run after 10 seconds to compile registered users and write mock emails
setTimeout(async () => {
    try {
        logger.info('Running startup dry-run for weekly email chronicles...');
        await sendWeeklyChronicles();
    } catch (err) {
        logger.error('Startup dry-run for weekly email chronicles failed:', { error: err });
    }
}, 10000);

logger.info('Starting HTTP server...');
httpServer.listen(port, '0.0.0.0', () => {
    logger.info('Server is running', { port, host: '0.0.0.0' });
}).on('error', (err) => {
    logger.error('Server failed to start', { err });
});

export default app;
