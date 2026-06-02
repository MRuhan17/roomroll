import dotenv from 'dotenv';
dotenv.config();

// Clean environment variables of trailing backticks, quotes, and spaces from shell copy-pasts
for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[`'"]|[`'"]$/g, '').trim();
    }
}

import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import campaignRoutes from './routes/campaignRoutes';
import mapRoutes from './routes/mapRoutes';
import tokenRoutes from './routes/tokenRoutes';
import aiRoutes from './routes/aiRoutes';
import characterRoutes from './routes/characterRoutes';
import loreRoutes from './routes/loreRoutes';

import { createLogger } from './lib/logger';
import { requestLogger } from './middleware/requestLogger';

const logger = createLogger('app');

import { corsOptions } from './config/cors';

export function createApp() {
    const app: Express = express();

    app.set('trust proxy', 1);

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(requestLogger);

    app.get('/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', message: 'Roomroll Backend is running' });
    });

    app.use('/api/auth', authRoutes);
    
    // Register param decoders for campaignId and id to transparently support non-sequential IDs
    const { decodeCampaignId } = require('./utils/campaignId');
    app.param('campaignId', (req: any, res: any, next: any, val: any) => {
        req.params.campaignId = String(decodeCampaignId(val));
        next();
    });
    app.param('id', (req: any, res: any, next: any, val: any) => {
        req.params.id = String(decodeCampaignId(val));
        next();
    });
    app.use('/api/rooms', roomRoutes);
    app.use('/api/campaigns', campaignRoutes);
    app.use('/api/campaigns/:campaignId/maps', mapRoutes);
    app.use('/api/campaigns/:campaignId/tokens', tokenRoutes);
    app.use('/api/campaigns/:campaignId/characters', characterRoutes);
    app.use('/api/campaigns/:id/world', loreRoutes);
    app.use('/api/ai', aiRoutes);


    app.use((error: unknown, req: Request, res: Response, _next: unknown) => {
        if (process.env.NODE_ENV === 'test') {
            console.error('UNHANDLED TEST ERROR:', error);
        }
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
