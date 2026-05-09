import { Router } from 'express';
import {
    createCampaignHandler,
    getActiveCampaignHandler,
    getCampaignHandler,
    getCampaignSnapshotHandler,
    joinCampaignHandler
} from '../controllers/campaignController';
import { authenticateRequest } from '../middleware/authMiddleware';
import { createRateLimiter } from '../middleware/rateLimit';

const router = Router();

const campaignLimiter = createRateLimiter({ windowMs: 60_000, max: 60, keyPrefix: 'campaign' });

router.post('/', authenticateRequest, campaignLimiter, createCampaignHandler);
router.post('/join', authenticateRequest, campaignLimiter, joinCampaignHandler);
router.get('/active', authenticateRequest, campaignLimiter, getActiveCampaignHandler);
router.get('/:campaignId', authenticateRequest, campaignLimiter, getCampaignHandler);
router.get('/:campaignId/snapshot', authenticateRequest, campaignLimiter, getCampaignSnapshotHandler);

export default router;
