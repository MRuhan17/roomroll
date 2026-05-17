import { Router } from 'express';
import { getWorldData, createLoreEntry, discoverEntity } from '../controllers/loreController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.use(authenticateRequest);

router.get('/', getWorldData);
router.post('/lore', createLoreEntry);
router.post('/discover', discoverEntity);

export default router;
