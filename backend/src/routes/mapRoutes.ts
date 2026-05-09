import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { activateMapHandler, createMapHandler, updateRevealStateHandler } from '../controllers/mapController';

const router = Router({ mergeParams: true });

router.post('/', authenticateRequest, createMapHandler);
router.patch('/:mapId/activate', authenticateRequest, activateMapHandler);
router.patch('/:mapId/reveal', authenticateRequest, updateRevealStateHandler);

export default router;
