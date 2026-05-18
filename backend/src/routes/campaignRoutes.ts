import { Router } from 'express';
import {
    createCampaignHandler,
    getActiveCampaignHandler,
    getCampaignHandler,
    getCampaignSnapshotHandler,
    joinCampaignHandler,
    updateCampaignHandler
} from '../controllers/campaignController';
import { authenticateRequest } from '../middleware/authMiddleware';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const router = Router();

const campaignLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => `campaign:${req.user?.id ?? ipKeyGenerator(req.ip ?? '')}`,
    message: { message: 'Too many requests' }
});

router.post('/', authenticateRequest, campaignLimiter, createCampaignHandler);
router.post('/join', authenticateRequest, campaignLimiter, joinCampaignHandler);
router.get('/active', authenticateRequest, campaignLimiter, getActiveCampaignHandler);
router.get('/:campaignId', authenticateRequest, campaignLimiter, getCampaignHandler);
router.put('/:campaignId', authenticateRequest, campaignLimiter, updateCampaignHandler);
router.get('/:campaignId/snapshot', authenticateRequest, campaignLimiter, getCampaignSnapshotHandler);

export default router;
