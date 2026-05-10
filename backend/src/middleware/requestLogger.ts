import { RequestHandler } from 'express';
import { createLogger } from '../lib/logger';

const logger = createLogger('http');

export const requestLogger: RequestHandler = (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
        next();
        return;
    }

    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        logger.info('Request completed', {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
        });
    });

    next();
};
