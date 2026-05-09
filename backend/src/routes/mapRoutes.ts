import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { createRateLimiter } from '../middleware/rateLimit';
import { activateMapHandler, createMapHandler, updateRevealStateHandler } from '../controllers/mapController';

const router = Router({ mergeParams: true });

const mapLimiter = createRateLimiter({ windowMs: 60_000, max: 120, keyPrefix: 'map' });

router.post('/', authenticateRequest, mapLimiter, createMapHandler);
router.patch('/:mapId/activate', authenticateRequest, mapLimiter, activateMapHandler);
router.patch('/:mapId/reveal', authenticateRequest, mapLimiter, updateRevealStateHandler);

export default router;
