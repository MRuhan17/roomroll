import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimit';
import { createMemoryHandler, generateNarrationHandler } from '../controllers/aiController';

const router = Router();

const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'ai' });

router.post('/narrate', authenticateRequest, aiLimiter, generateNarrationHandler);
router.post('/memory', authenticateRequest, aiLimiter, createMemoryHandler);

export default router;
