import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/authService';
import { createLogger } from '../lib/logger';

const logger = createLogger('auth-middleware');

export const authenticateRequest = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    logger.info('Incoming request authentication attempt', {
        path: req.path,
        method: req.method,
        hasAuthHeader: !!authHeader,
        authHeaderType: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer' : 'Other') : 'None',
        tokenLength: authHeader ? authHeader.length : 0
    });

    if (!authHeader) {
        logger.warn('Authentication failed: Missing authorization header');
        return res.status(401).json({ message: 'Missing authorization header' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    try {
        const user = verifyToken(token);
        req.user = user;
        
        logger.info('Authentication successful', {
            userId: user.id,
            userEmail: user.email
        });
        
        return next();
    } catch (error: any) {
        logger.error('Authentication failed: Invalid or expired token', {
            error: error.message || error,
            tokenSnippet: token ? `${token.substring(0, 10)}...` : 'None'
        });
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

