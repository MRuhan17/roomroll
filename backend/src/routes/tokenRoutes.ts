import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { createTokenHandler, moveTokenHandler, updateTokenHandler } from '../controllers/tokenController';

const router = Router({ mergeParams: true });

const tokenLimiter = rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `token:${req.user?.id ?? ipKeyGenerator(req.ip ?? '')}`,
    message: { message: 'Too many requests' }
});

router.post('/', authenticateRequest, tokenLimiter, createTokenHandler);
router.patch('/:tokenId/move', authenticateRequest, tokenLimiter, moveTokenHandler);
router.patch('/:tokenId', authenticateRequest, tokenLimiter, updateTokenHandler);

export default router;
