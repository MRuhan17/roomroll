import { Router } from 'express';
import { getWorldData, createLoreEntry, discoverEntity } from '../controllers/loreController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get('/', getWorldData);
router.post('/lore', createLoreEntry);
router.post('/discover', discoverEntity);

export default router;
