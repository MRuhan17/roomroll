import { createServer } from 'http';
import dotenv from 'dotenv';
import app, { resolveCorsOrigin } from './app';
import { createLogger } from './lib/logger';
import { registerRealtimeHandlers } from './realtime/roomState';
import { initializeSocket } from './socket';

dotenv.config();

const logger = createLogger('server');
const httpServer = createServer(app);

const port = process.env.PORT || 5000;

// Initialize both sets of socket handlers
const io = initializeSocket(httpServer);
registerRealtimeHandlers(io);

httpServer.listen(port, () => {
    logger.info('Server is running', { port });
});

export default app;
