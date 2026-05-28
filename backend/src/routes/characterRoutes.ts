import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { authenticateRequest } from '../middleware/authMiddleware';
import {
    addInventoryItemHandler,
    addStatusEffectHandler,
    awardExperienceHandler,
    createCharacterHandler,
    equipInventoryItemHandler,
    getCharacterHandler,
    listCharactersHandler,
    removeStatusEffectHandler,
    unequipInventoryItemHandler,
    updateCharacterHandler,
    updateInventoryItemHandler,
    updateStatusEffectHandler,
} from '../controllers/characterController';
import { validateBody, characterSchema } from '../middleware/validationMiddleware';

const router = Router({ mergeParams: true });

const characterLimiter = rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `character:${req.user?.id ?? ipKeyGenerator(req.ip ?? '')}`,
    message: { message: 'Too many requests' },
});

router.get('/', authenticateRequest, characterLimiter, listCharactersHandler);
router.post('/', authenticateRequest, characterLimiter, validateBody(characterSchema), createCharacterHandler);
router.get('/:characterId', authenticateRequest, characterLimiter, getCharacterHandler);
router.patch('/:characterId', authenticateRequest, characterLimiter, validateBody(characterSchema.partial()), updateCharacterHandler);
router.post('/:characterId/xp', authenticateRequest, characterLimiter, awardExperienceHandler);
router.post('/:characterId/inventory', authenticateRequest, characterLimiter, addInventoryItemHandler);
router.patch('/:characterId/inventory/:itemId', authenticateRequest, characterLimiter, updateInventoryItemHandler);
router.post('/:characterId/equipment', authenticateRequest, characterLimiter, equipInventoryItemHandler);
router.delete('/:characterId/equipment/:slot', authenticateRequest, characterLimiter, unequipInventoryItemHandler);
router.post('/:characterId/status-effects', authenticateRequest, characterLimiter, addStatusEffectHandler);
router.patch('/:characterId/status-effects/:effectId', authenticateRequest, characterLimiter, updateStatusEffectHandler);
router.delete('/:characterId/status-effects/:effectId', authenticateRequest, characterLimiter, removeStatusEffectHandler);

export default router;
