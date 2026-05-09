import { Router } from 'express';
import {
    createCampaignHandler,
    getActiveCampaignHandler,
    getCampaignHandler,
    getCampaignSnapshotHandler,
    joinCampaignHandler
} from '../controllers/campaignController';
import { authenticateRequest } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticateRequest, createCampaignHandler);
router.post('/join', authenticateRequest, joinCampaignHandler);
router.get('/active', authenticateRequest, getActiveCampaignHandler);
router.get('/:campaignId', authenticateRequest, getCampaignHandler);
router.get('/:campaignId/snapshot', authenticateRequest, getCampaignSnapshotHandler);

export default router;
