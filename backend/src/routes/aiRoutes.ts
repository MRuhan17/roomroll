import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { createRateLimiter } from '../middleware/rateLimit';
import { createMemoryHandler, generateNarrationHandler } from '../controllers/aiController';

const router = Router();

const aiLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyPrefix: 'ai' });

router.post('/narrate', authenticateRequest, aiLimiter, generateNarrationHandler);
router.post('/memory', authenticateRequest, aiLimiter, createMemoryHandler);

export default router;
