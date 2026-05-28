import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { toRequestHandler } from '../lib/requestHandler';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, toRequestHandler(register));
router.post('/login', loginLimiter, toRequestHandler(login));

export default router;
