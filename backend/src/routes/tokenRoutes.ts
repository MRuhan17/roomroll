import { Router } from 'express';
import { authenticateRequest } from '../middleware/authMiddleware';
import { createTokenHandler, moveTokenHandler, updateTokenHandler } from '../controllers/tokenController';

const router = Router({ mergeParams: true });

router.post('/', authenticateRequest, createTokenHandler);
router.patch('/:tokenId/move', authenticateRequest, moveTokenHandler);
router.patch('/:tokenId', authenticateRequest, updateTokenHandler);

export default router;
