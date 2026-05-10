import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import app, { resolveCorsOrigin } from './app';
import { createLogger } from './lib/logger';
import { registerRealtimeHandlers } from './realtime/roomState';

dotenv.config();

const logger = createLogger('server');
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: resolveCorsOrigin(),
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

registerRealtimeHandlers(io);

httpServer.listen(port, () => {
    logger.info('Server is running', { url: `http://localhost:${port}` });
});
