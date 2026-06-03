import { Request, Response } from 'express';
import { generateNarration } from '../ai/aiService';
import { createCampaignMemory } from '../services/memoryService';
import { getMember } from '../services/campaignService';
import { getIo } from '../socket';
import { SocketEvents } from '../types/socket';
import { getCampaignSnapshot } from '../services/campaignStateService';

export const generateNarrationHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { campaignId, playerAction, tone } = req.body as {
        campaignId?: number;
        playerAction?: string;
        tone?: 'cinematic' | 'mysterious' | 'intense' | 'light';
    };
    if (!campaignId || !playerAction) {
        return res.status(400).json({ message: 'campaignId and playerAction required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    try {
        const narration = await generateNarration({
            campaignId,
            playerAction,
            tone,
            userId: user.id
        });
        const io = getIo();
        io.to(`campaign:${campaignId}`).emit(SocketEvents.NewNarration, {
            userId: user.id,
            text: narration.narration,
            ai: true
        });
        
        // Broadcast emotional memory moment if one was logged
        if (narration.detectedMoment) {
            io.to(`campaign:${campaignId}`).emit(SocketEvents.NewMemoryMoment, {
                memory: narration.detectedMoment
            });
        }
        
        // Broadcast the updated campaign state to sync the new mood/ambience with all clients
        try {
            const snapshot = await getCampaignSnapshot(campaignId);
            io.to(`campaign:${campaignId}`).emit(SocketEvents.CampaignState, {
                snapshot
            });
        } catch (snapErr) {
            console.error('Failed to broadcast campaign state update after narration:', snapErr);
        }
        
        return res.json({ narration });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to generate narration' });
    }
};

export const createMemoryHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const { campaignId, summary, keyFacts } = req.body as {
        campaignId?: number;
        summary?: string;
        keyFacts?: Array<Record<string, unknown>>;
    };
    if (!campaignId || !summary) {
        return res.status(400).json({ message: 'campaignId and summary required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    try {
        const memory = await createCampaignMemory(campaignId, summary, keyFacts ?? []);
        return res.status(201).json({ memory });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create memory' });
    }
};
