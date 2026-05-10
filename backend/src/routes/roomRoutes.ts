import { Router } from 'express';
import { createRoom, joinRoom, fetchRooms, fetchRoomDetails, generateNPC } from '../controllers/roomController';
import { toRequestHandler } from '../lib/requestHandler';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.post('/', toRequestHandler(createRoom));
router.post('/join', toRequestHandler(joinRoom));
router.get('/', toRequestHandler(fetchRooms));
router.get('/:id', toRequestHandler(fetchRoomDetails));
router.post('/:id/npc', toRequestHandler(generateNPC));

export default router;
