import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { createLogger } from '../lib/logger';
import { broadcastToRoom } from '../realtime/roomState';
import { getMember } from '../services/campaignService';

const logger = createLogger('loreController');

export const getWorldData = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = Number(req.params.id);
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const member = await getMember(campaignId, user.id);
        if (!member) {
            res.status(403).json({ message: 'Access denied: Not a member of this campaign' });
            return;
        }

        // Fetch lore with campaign isolation filtering (hidden for players)
        let loreQuery = supabase
            .from('campaign_lore_entries')
            .select('*')
            .eq('campaign_id', campaignId);
            
        if (member.role === 'player') {
            loreQuery = loreQuery.or('is_secret.eq.false,is_discovered.eq.true');
        }
        
        const { data: lore, error: loreError } = await loreQuery;
        if (loreError) throw loreError;

        // Fetch factions with campaign isolation filtering (hidden for players)
        let factionsQuery = supabase
            .from('campaign_factions')
            .select('*')
            .eq('campaign_id', campaignId);
            
        if (member.role === 'player') {
            factionsQuery = factionsQuery.eq('is_discovered', true);
        }

        const { data: factions, error: factionsError } = await factionsQuery;
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
        const campaignId = Number(req.params.id);
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const member = await getMember(campaignId, user.id);
        if (!member || member.role !== 'DM') {
            res.status(403).json({ message: 'DM role required' });
            return;
        }

        const { title, category, content, is_secret, is_discovered } = req.body;

        if (!title || !content) {
            res.status(400).json({ message: 'Title and content are required' });
            return;
        }

        const { data, error } = await supabase
            .from('campaign_lore_entries')
            .insert([{ 
                campaign_id: campaignId, 
                title, 
                category: category || 'General', 
                content, 
                is_secret: is_secret ?? false, 
                is_discovered: is_discovered ?? true 
            }])
            .select()
            .single();

        if (error) throw error;
        
        // If it starts discovered, notify players in room (if active)
        if (data.is_discovered) {
            broadcastToRoom(String(campaignId), 'lore_discovered', { lore: data });
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Failed to create lore entry', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const createFaction = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = Number(req.params.id);
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const member = await getMember(campaignId, user.id);
        if (!member || member.role !== 'DM') {
            res.status(403).json({ message: 'DM role required' });
            return;
        }

        const { name, description, is_secret, is_discovered } = req.body;

        if (!name || !description) {
            res.status(400).json({ message: 'Name and description are required' });
            return;
        }

        const { data, error } = await supabase
            .from('campaign_factions')
            .insert([{ 
                campaign_id: campaignId, 
                name, 
                description, 
                is_discovered: is_discovered ?? true 
            }])
            .select()
            .single();

        if (error) throw error;
        
        if (data.is_discovered) {
            broadcastToRoom(String(campaignId), 'faction_discovered', { faction: data });
        }

        res.status(201).json(data);
    } catch (error) {
        logger.error('Failed to create faction', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const discoverEntity = async (req: Request, res: Response): Promise<void> => {
    try {
        const campaignId = Number(req.params.id);
        const user = req.user;

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const member = await getMember(campaignId, user.id);
        if (!member || member.role !== 'DM') {
            res.status(403).json({ message: 'DM role required' });
            return;
        }

        const { entity_type, entity_id } = req.body;
        const userId = user.id;

        if (!entity_type || !entity_id) {
            res.status(400).json({ message: 'Entity type and ID are required' });
            return;
        }

        // Mark as discovered based on type
        if (entity_type === 'lore') {
            await supabase.from('campaign_lore_entries').update({ is_discovered: true }).eq('id', entity_id).eq('campaign_id', campaignId);
        } else if (entity_type === 'faction') {
            await supabase.from('campaign_factions').update({ is_discovered: true }).eq('id', entity_id).eq('campaign_id', campaignId);
        }

        // Record discovery
        const { data, error } = await supabase
            .from('campaign_discoveries')
            .insert([{ campaign_id: campaignId, entity_type, entity_id, discovered_by: userId }])
            .select()
            .single();

        if (error) throw error;

        // Broadcast to clients
        broadcastToRoom(String(campaignId), 'entity_discovered', { discovery: data, entity_type, entity_id });

        res.status(201).json(data);
    } catch (error) {
        logger.error('Failed to record discovery', { error });
        res.status(500).json({ message: 'Internal server error' });
    }
};
