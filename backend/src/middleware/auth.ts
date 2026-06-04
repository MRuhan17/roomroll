import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { createLogger } from '../lib/logger';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
    };
}

const logger = createLogger('auth-middleware');

export const authenticateToken: RequestHandler = (req, res: Response, next: NextFunction) => {
    const authRequest = req as AuthRequest;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!token) {
        return res.status(401).json({ message: 'MissingTokenError' });
    }

    if (!jwtSecret) {
        logger.error('JWT verification attempted without JWT_SECRET');
        return res.status(500).json({ message: 'Authentication is not configured' });
    }

    jwt.verify(token, jwtSecret, (err: any, user: any) => {
        if (err) {
            console.error("JWT verification failed:", err.message);
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        authRequest.user = user;
        next();
    });
};
