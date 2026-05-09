import { NextFunction, Request, Response } from 'express';

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyPrefix: string;
}

const store = new Map<string, RateLimitEntry>();

export const rateLimit = (options: RateLimitOptions) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userKey = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
        const key = `${options.keyPrefix}:${userKey}`;
        const now = Date.now();
        const existing = store.get(key);

        if (!existing || now > existing.resetAt) {
            store.set(key, { count: 1, resetAt: now + options.windowMs });
            return next();
        }

        if (existing.count >= options.max) {
            const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfter.toString());
            return res.status(429).json({ message: 'Too many requests' });
        }

        existing.count += 1;
        store.set(key, existing);
        return next();
    };
};
