import { Request, Response } from 'express';
import { createCampaign, getCampaignById, getCampaignByInviteCode, getMember, getUserActiveCampaign, joinCampaign, listMembers } from '../services/campaignService';
import { getCampaignSnapshot } from '../services/campaignStateService';

export const createCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { name, description, worldType } = req.body as {
        name?: string;
        description?: string;
        worldType?: string;
    };
    if (!name) {
        return res.status(400).json({ message: 'Campaign name is required' });
    }
    try {
        const campaign = await createCampaign({
            name,
            description,
            worldType,
            dmUserId: user.id
        });
        return res.status(201).json({ campaign });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create campaign' });
    }
};

export const joinCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { inviteCode } = req.body as { inviteCode?: string };
    if (!inviteCode) {
        return res.status(400).json({ message: 'Invite code required' });
    }
    const campaign = await getCampaignByInviteCode(inviteCode);
    if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }
    try {
        const membership = await joinCampaign(campaign.id, user.id);
        return res.json({ campaign, membership });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to join campaign' });
    }
};

export const getActiveCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaign = await getUserActiveCampaign(user.id);
    if (!campaign) {
        return res.status(404).json({ message: 'No active campaign found' });
    }
    return res.json({ campaign });
};

export const getCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
    }
    const members = await listMembers(campaignId);
    return res.json({ campaign, members });
};

export const getCampaignSnapshotHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    const snapshot = await getCampaignSnapshot(campaignId);
    return res.json({ snapshot });
};

export const updateCampaignHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    const { description, worldType } = req.body as { description?: string, worldType?: string };
    
    // Quick update via supabase client directly since campaignService doesn't have it
    const { supabase } = await import('../config/db');
    const { data, error } = await supabase
        .from('campaigns')
        .update({ description, world_type: worldType })
        .eq('id', campaignId)
        .select('*')
        .single();
        
    if (error) {
        return res.status(500).json({ message: 'Failed to update campaign' });
    }
    return res.json({ campaign: data });
};
