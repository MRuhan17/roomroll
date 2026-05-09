import { rateLimit } from 'express-rate-limit';

export interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyPrefix: string;
}

export const createRateLimiter = (options: RateLimitOptions) =>
    rateLimit({
        windowMs: options.windowMs,
        limit: options.max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userKey = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
            return `${options.keyPrefix}:${userKey}`;
        },
        message: { message: 'Too many requests' }
    });
