import { Request, Response } from 'express';
import { createMap, setActiveMap, updateRevealState } from '../services/mapService';
import { getMember } from '../services/campaignService';
import { supabase } from '../config/db';

export const createMapHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const { name, imageUrl, imageBase64, gridEnabled, gridSize } = req.body as {
        name?: string;
        imageUrl?: string;
        imageBase64?: string;
        gridEnabled?: boolean;
        gridSize?: number;
    };
    
    if (!campaignId || !name || (!imageUrl && !imageBase64)) {
        return res.status(400).json({ message: 'Campaign, name, and image are required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    
    let finalImageUrl = imageUrl;
    
    if (imageBase64) {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const buffer = Buffer.from(matches[2], 'base64');
            
            // File Upload Security Checks
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedMimeTypes.includes(mimeType)) {
                return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' });
            }
            
            // 5MB limit
            const maxSize = 5 * 1024 * 1024;
            if (buffer.length > maxSize) {
                return res.status(400).json({ message: 'File is too large. Maximum size is 5MB.' });
            }

            const fileName = `${campaignId}/${Date.now()}-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
            
            const { error: uploadError } = await supabase.storage
                .from('maps')
                .upload(fileName, buffer, {
                    contentType: mimeType
                });
                
            if (uploadError) {
                return res.status(500).json({ message: 'Failed to upload map image' });
            }
            
            const { data: publicUrlData } = supabase.storage.from('maps').getPublicUrl(fileName);
            finalImageUrl = publicUrlData.publicUrl;
        } else {
             return res.status(400).json({ message: 'Invalid imageBase64 format' });
        }
    }

    try {
        const map = await createMap({
            campaignId,
            name,
            imageUrl: finalImageUrl as string,
            gridEnabled: Boolean(gridEnabled),
            gridSize
        });
        return res.status(201).json({ map });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create map' });
    }
};

export const activateMapHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const mapId = Number(req.params.mapId);
    if (!campaignId || !mapId) {
        return res.status(400).json({ message: 'Campaign ID and map ID required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    try {
        await setActiveMap(campaignId, mapId);
        return res.json({ status: 'ok' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to activate map' });
    }
};

export const updateRevealStateHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const campaignId = Number(req.params.campaignId);
    const mapId = Number(req.params.mapId);
    const { revealState } = req.body as { revealState?: Record<string, unknown> };
    if (!campaignId || !mapId || !revealState) {
        return res.status(400).json({ message: 'Campaign ID, map ID, and revealState required' });
    }
    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }
    try {
        const map = await updateRevealState(campaignId, mapId, revealState);
        return res.json({ map });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update map reveal state' });
    }
};
