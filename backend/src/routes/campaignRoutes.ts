import { Router } from 'express';
import {
    createCampaignHandler,
    getActiveCampaignHandler,
    getUserCampaignsHandler,
    getCampaignHandler,
    getCampaignSnapshotHandler,
    joinCampaignHandler,
    updateCampaignHandler,
    getStoryPrepHandler,
    generateStoryPrepHandler,
    updateStoryPointHandler,
    addCustomStoryPointHandler,
    getSessionRecapsHandler,
    generateSessionRecapHandler,
    updateCampaignPacingHandler,
    getTavernHandler,
    generateTavernHandler,
    chatWithNpcHandler,
    respondToFactionRecruitmentHandler,
    triggerTavernEventHandler,
    updateCampaignAmbienceHandler
} from '../controllers/campaignController';
import { authenticateRequest } from '../middleware/authMiddleware';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const router = Router();

const campaignLimiter = rateLimit({
    windowMs: 60_000,
    limit: 60,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req: any) => `campaign:${req.user?.id ?? ipKeyGenerator(req.ip ?? '')}`,
    message: { message: 'Too many requests' }
});

router.get('/', authenticateRequest, campaignLimiter, getUserCampaignsHandler);
router.post('/', authenticateRequest, campaignLimiter, createCampaignHandler);
router.post('/join', authenticateRequest, campaignLimiter, joinCampaignHandler);
router.get('/active', authenticateRequest, campaignLimiter, getActiveCampaignHandler);
router.get('/:campaignId', authenticateRequest, campaignLimiter, getCampaignHandler);
router.put('/:campaignId', authenticateRequest, campaignLimiter, updateCampaignHandler);
router.put('/:campaignId/ambience', authenticateRequest, campaignLimiter, updateCampaignAmbienceHandler);
router.put('/:campaignId/pacing', authenticateRequest, campaignLimiter, updateCampaignPacingHandler);
router.get('/:campaignId/snapshot', authenticateRequest, campaignLimiter, getCampaignSnapshotHandler);

// Story Preparation Endpoints
router.get('/:campaignId/story-prep', authenticateRequest, campaignLimiter, getStoryPrepHandler);
router.post('/:campaignId/story-prep/regenerate', authenticateRequest, campaignLimiter, generateStoryPrepHandler);
router.post('/:campaignId/story-prep/points', authenticateRequest, campaignLimiter, addCustomStoryPointHandler);
router.put('/:campaignId/story-prep/points/:pointId', authenticateRequest, campaignLimiter, updateStoryPointHandler);

// Session Recap Endpoints
router.get('/:campaignId/sessions/recaps', authenticateRequest, campaignLimiter, getSessionRecapsHandler);
router.post('/:campaignId/sessions/:sessionId/recap/generate', authenticateRequest, campaignLimiter, generateSessionRecapHandler);

// Tavern Endpoints
router.get('/:campaignId/tavern', authenticateRequest, campaignLimiter, getTavernHandler);
router.post('/:campaignId/tavern/generate', authenticateRequest, campaignLimiter, generateTavernHandler);
router.post('/:campaignId/tavern/npcs/:npcId/chat', authenticateRequest, campaignLimiter, chatWithNpcHandler);
router.post('/:campaignId/tavern/factions/:encounterId/respond', authenticateRequest, campaignLimiter, respondToFactionRecruitmentHandler);
router.post('/:campaignId/tavern/events/trigger', authenticateRequest, campaignLimiter, triggerTavernEventHandler);

export default router;
