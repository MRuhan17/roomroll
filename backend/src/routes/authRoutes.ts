import { Router } from 'express';
import { register, login, exportUserData, deleteAccount } from '../controllers/authController';
import { toRequestHandler } from '../lib/requestHandler';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', registerLimiter, toRequestHandler(register));
router.post('/login', loginLimiter, toRequestHandler(login));

router.get('/export', authenticateToken, toRequestHandler(exportUserData));
router.delete('/account', authenticateToken, toRequestHandler(deleteAccount));

export default router;
