import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { createMemoryHandler, generateNarrationHandler } from '../controllers/aiController';

const router = Router();

router.post('/narrate', authenticateRequest, generateNarrationHandler);
router.post('/memory', authenticateRequest, createMemoryHandler);

export default router;
