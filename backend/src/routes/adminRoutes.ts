import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendTestChronicle } from '../services/emailService';
import { createLogger } from '../lib/logger';
import { emailLimiter } from '../middleware/rateLimiter';

const logger = createLogger('admin-routes');
const router = Router();

// Expose POST /send-test-chronicle to authenticated admins/devs
router.post('/send-test-chronicle', authenticateToken, emailLimiter, async (req: AuthRequest, res: Response) => {
    try {
        logger.info(`Admin test chronicle send triggered by user ${req.user?.email || 'unknown'}`);
        const result = await sendTestChronicle(req.user?.id, req.ip);
        res.json({
            message: 'Admin test chronicle run complete.',
            ...result
        });
    } catch (err: any) {
        logger.error('Failed to trigger admin test email chronicles:', { error: err });
        res.status(500).json({
            message: err.message || 'Failed to dispatch test emails.'
        });
    }
});

export default router;
