import { Request, Response } from 'express';
import { createToken, moveToken, updateToken } from '../services/tokenService';
import { getMember } from '../services/campaignService';

export const createTokenHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const { mapId, tokenType, label, hpCurrent, hpMax, position, isHidden } = req.body as {
        mapId?: number;
        tokenType?: 'player' | 'enemy' | 'npc' | 'boss';
        label?: string;
        hpCurrent?: number;
        hpMax?: number;
        position?: { x: number; y: number; snapped?: boolean };
        isHidden?: boolean;
    };
    if (!campaignId || !mapId || !tokenType || !position) {
        return res.status(400).json({ message: 'Campaign, map, tokenType, and position required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    try {
        const token = await createToken({
            campaignId,
            mapId,
            tokenType,
            label,
            hpCurrent,
            hpMax,
            position,
            isHidden
        });
        return res.status(201).json({ token });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create token' });
    }
};

export const moveTokenHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const tokenId = Number(req.params.tokenId);
    const { position } = req.body as { position?: { x: number; y: number; snapped?: boolean } };
    if (!campaignId || !tokenId || !position) {
        return res.status(400).json({ message: 'Campaign, token ID, and position required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    try {
        const token = await moveToken(campaignId, tokenId, position);
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to move token' });
    }
};

export const updateTokenHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const tokenId = Number(req.params.tokenId);
    const { hpCurrent, hpMax, label, isHidden } = req.body as {
        hpCurrent?: number;
        hpMax?: number;
        label?: string;
        isHidden?: boolean;
    };
    if (!campaignId || !tokenId) {
        return res.status(400).json({ message: 'Campaign and token ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }
    try {
        const token = await updateToken(campaignId, tokenId, {
            hp_current: hpCurrent,
            hp_max: hpMax,
            label,
            is_hidden: isHidden
        });
        return res.json({ token });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update token' });
    }
};
