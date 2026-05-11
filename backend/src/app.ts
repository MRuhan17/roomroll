import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import campaignRoutes from './routes/campaignRoutes';
import mapRoutes from './routes/mapRoutes';
import tokenRoutes from './routes/tokenRoutes';
import aiRoutes from './routes/aiRoutes';
import characterRoutes from './routes/characterRoutes';
import { createLogger } from './lib/logger';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const logger = createLogger('app');

import { corsOptions } from './config/cors';

export function createApp() {
    const app: Express = express();

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(requestLogger);

    app.get('/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', message: 'Roomroll Backend is running' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/campaigns', campaignRoutes);
    app.use('/api/campaigns/:campaignId/maps', mapRoutes);
    app.use('/api/campaigns/:campaignId/tokens', tokenRoutes);
    app.use('/api/campaigns/:campaignId/characters', characterRoutes);
    app.use('/api/ai', aiRoutes);

    app.use((error: unknown, req: Request, res: Response, _next: unknown) => {
        logger.error('Unhandled application error', {
            method: req.method,
            path: req.originalUrl,
            error,
        });
        res.status(500).json({ message: 'Unexpected server error' });
    });

    return app;
}

const app = createApp();

export default app;
