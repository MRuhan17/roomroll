import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import roomRoutes from './routes/roomRoutes';
import { createLogger } from './lib/logger';
import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const logger = createLogger('app');

export function resolveCorsOrigin() {
    if (!process.env.CORS_ORIGIN) {
        return true;
    }

    return process.env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

export function createApp() {
    const app: Express = express();

    app.use(
        cors({
            origin: resolveCorsOrigin(),
            credentials: true,
        })
    );
    app.use(express.json());
    app.use(requestLogger);

    app.get('/health', (_req: Request, res: Response) => {
        res.json({ status: 'ok', message: 'Roomroll Backend is running' });
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/rooms', roomRoutes);

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
