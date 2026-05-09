import jwt, { JwtPayload } from 'jsonwebtoken';
import { AuthUser } from '../types/auth';

export const verifyToken = (token: string): AuthUser => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT secret not configured');
    }
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
    return {
        id,
        email
    };
};
