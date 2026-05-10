import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { toRequestHandler } from '../lib/requestHandler';

const router = Router();

router.post('/register', toRequestHandler(register));
router.post('/login', toRequestHandler(login));

export default router;
