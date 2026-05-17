import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { createLogger } from '../lib/logger';
import { broadcastToRoom } from '../realtime/roomState';

const logger = createLogger('loreController');

export const getWorldData = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = req.params.id as string;

        // Fetch lore
        const { data: lore, error: loreError } = await supabase
            .from('campaign_lore_entries')
            .select('*')
            .eq('campaign_id', campaignId);
            
        if (loreError) throw loreError;

        // Fetch factions
        const { data: factions, error: factionsError } = await supabase
            .from('campaign_factions')
            .select('*')
            .eq('campaign_id', campaignId);

        if (factionsError) throw factionsError;

        // Fetch events/discoveries (timeline)
        const { data: discoveries, error: discError } = await supabase
            .from('campaign_discoveries')
            .select('*, users(display_name)')
            .eq('campaign_id', campaignId)
            .order('discovered_at', { ascending: false });

        if (discError) throw discError;

        const { data: worldEvents, error: eventsError } = await supabase
            .from('campaign_world_events')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false });

        if (eventsError) throw eventsError;

        res.json({
            lore: lore || [],
            factions: factions || [],
            discoveries: discoveries || [],
            worldEvents: worldEvents || []
        });
    } catch (error) {
        logger.error('Failed to fetch world data', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createLoreEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = req.params.id as string;
        const { title, category, content, is_secret, is_discovered } = req.body;

        const { data, error } = await supabase
            .from('campaign_lore_entries')
            .insert([{ campaign_id: campaignId, title, category, content, is_secret, is_discovered }])
            .select()
            .single();

        if (error) throw error;
        
        // If it starts discovered, notify players in room (if active)
        if (is_discovered) {
            broadcastToRoom(campaignId, 'lore_discovered', { lore: data });
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Failed to create lore entry', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const discoverEntity = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = req.params.id as string;
        const { entity_type, entity_id } = req.body;
        const userId = req.user?.id; // Assuming auth middleware sets req.user

        // Mark as discovered based on type
        if (entity_type === 'lore') {
            await supabase.from('campaign_lore_entries').update({ is_discovered: true }).eq('id', entity_id);
        } else if (entity_type === 'faction') {
            await supabase.from('campaign_factions').update({ is_discovered: true }).eq('id', entity_id);
        }

        // Record discovery
        const { data, error } = await supabase
            .from('campaign_discoveries')
            .insert([{ campaign_id: campaignId, entity_type, entity_id, discovered_by: userId }])
            .select()
            .single();

        if (error) throw error;

        // Broadcast to clients
        broadcastToRoom(campaignId, 'entity_discovered', { discovery: data, entity_type, entity_id });

        res.status(201).json(data);
    } catch (error) {
        logger.error('Failed to record discovery', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
