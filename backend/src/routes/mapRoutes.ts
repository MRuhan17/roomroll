import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { activateMapHandler, createMapHandler, updateRevealStateHandler } from '../controllers/mapController';

const router = Router({ mergeParams: true });

const mapLimiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `map:${req.user?.id ?? ipKeyGenerator(req.ip ?? '')}`,
    message: { message: 'Too many requests' }
});

router.post('/', authenticateRequest, mapLimiter, createMapHandler);
router.patch('/:mapId/activate', authenticateRequest, mapLimiter, activateMapHandler);
router.patch('/:mapId/reveal', authenticateRequest, mapLimiter, updateRevealStateHandler);

export default router;
