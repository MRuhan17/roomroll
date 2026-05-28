import { Router } from 'express';
import { getWorldData, createLoreEntry, discoverEntity, createFaction } from '../controllers/loreController';
import { authenticateRequest } from '../middleware/authMiddleware';
import { validateBody, loreSchema } from '../middleware/validationMiddleware';

const router = Router({ mergeParams: true });

router.use(authenticateRequest);

router.get('/', getWorldData);
router.post('/lore', validateBody(loreSchema), createLoreEntry);
router.post('/factions', createFaction);
router.post('/discover', discoverEntity);

export default router;
