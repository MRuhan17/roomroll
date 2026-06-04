import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthUser } from '../types/auth';

import { createLogger } from '../lib/logger';

const logger = createLogger('auth-service');

export const verifyToken = (token: string): AuthUser => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        logger.error('JWT verification failed', { error: 'JWT secret not configured' });
        throw new Error('JWT secret not configured');
    }
    try {
        const decoded = jwt.verify(token, secret) as JwtPayload;
        if (!decoded || typeof decoded !== 'object') {
            throw new Error('Invalid token');
        }
        const id = Number(decoded.id);
        if (Number.isNaN(id) || id <= 0) {
            throw new Error('Invalid token payload');
        }
        const email = decoded.email;
        if (!email || typeof email !== 'string') {
            throw new Error('Invalid token payload');
        }
        logger.debug('JWT verified successfully', {
            userId: id,
            exp: decoded.exp
        });
        return {
            id,
            email
        };
    } catch (error: any) {
        // Safe logging of the decoded token (if decoding is possible) to capture expiration
        let exp;
        try {
            const decoded = jwt.decode(token) as JwtPayload;
            if (decoded && decoded.exp) exp = decoded.exp;
        } catch (e) {
            // ignore
        }
        
        logger.error('JWT verification failed', {
            errorType: error.name || 'Error',
            errorMessage: error.message,
            exp: exp
        });
        throw error;
    }
};
