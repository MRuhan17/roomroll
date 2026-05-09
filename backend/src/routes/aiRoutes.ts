import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import rateLimit from 'express-rate-limit';
import { createMemoryHandler, generateNarrationHandler } from '../controllers/aiController';

const router = Router();

const aiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `ai:${req.user?.id ?? req.ip}`,
    message: { message: 'Too many requests' }
});

router.post('/narrate', authenticateRequest, aiLimiter, generateNarrationHandler);
router.post('/memory', authenticateRequest, aiLimiter, createMemoryHandler);

export default router;
