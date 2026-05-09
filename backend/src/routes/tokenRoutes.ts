import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimit';
import { createTokenHandler, moveTokenHandler, updateTokenHandler } from '../controllers/tokenController';

const router = Router({ mergeParams: true });

const tokenLimiter = rateLimit({ windowMs: 60_000, max: 180, keyPrefix: 'token' });

router.post('/', authenticateRequest, tokenLimiter, createTokenHandler);
router.patch('/:tokenId/move', authenticateRequest, tokenLimiter, moveTokenHandler);
router.patch('/:tokenId', authenticateRequest, tokenLimiter, updateTokenHandler);

export default router;
