import { supabase } from '../config/db';
import { Campaign, CampaignEvent, CampaignMember, CampaignMemory, CampaignQuest, CampaignWorldEvent } from '../types/campaign';
import { CampaignCharacter } from '../types/character';
import { DiceRollRow } from '../types/dice';
import { CampaignMap, MapToken } from '../types/map';
import { listCharacters } from './characterService';

export interface CampaignSnapshot {
    campaign: Campaign | null;
    members: CampaignMember[];
    activeMap: CampaignMap | null;
    tokens: MapToken[];
    quests: CampaignQuest[];
    worldEvents: CampaignWorldEvent[];
    recentEvents: CampaignEvent[];
    diceHistory: DiceRollRow[];
    memories: CampaignMemory[];
    characters: CampaignCharacter[];
    lore: Record<string, any>[];
    factions: Record<string, any>[];
}

export const getCampaignSnapshot = async (campaignId: number): Promise<CampaignSnapshot> => {
    const campaignPromise = supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

    const membersPromise = supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignId);

    const activeMapPromise = supabase
        .from('campaign_maps')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('is_active', true)
        .maybeSingle();

    const questsPromise = supabase
        .from('campaign_quests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false });

    const worldEventsPromise = supabase
        .from('campaign_world_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

    const recentEventsPromise = supabase
        .from('campaign_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(50);

    const diceHistoryPromise = supabase
        .from('dice_rolls')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(20);

    const memoriesPromise = supabase
        .from('campaign_memories')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('updated_at', { ascending: false })
        .limit(10);

    const lorePromise = supabase
        .from('campaign_lore_entries')
        .select('*')
        .eq('campaign_id', campaignId);

    const factionsPromise = supabase
        .from('campaign_factions')
        .select('*')
        .eq('campaign_id', campaignId);

    const charactersPromise = listCharacters(campaignId);

    const [
        campaignResult,
        membersResult,
        activeMapResult,
        questsResult,
        worldEventsResult,
        recentEventsResult,
        diceHistoryResult,
        memoriesResult,
        loreResult,
        factionsResult,
        characters
    ] = await Promise.all([
        campaignPromise,
        membersPromise,
        activeMapPromise,
        questsPromise,
        worldEventsPromise,
        recentEventsPromise,
        diceHistoryPromise,
        memoriesPromise,
        lorePromise,
        factionsPromise,
        charactersPromise
    ]);

    let tokens: MapToken[] = [];
    if (activeMapResult.data) {
        const tokenResult = await supabase
            .from('map_tokens')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('map_id', activeMapResult.data.id);
        tokens = (tokenResult.data ?? []) as MapToken[];
    }

    return {
        campaign: (campaignResult.data ?? null) as Campaign | null,
        members: (membersResult.data ?? []) as CampaignMember[],
        activeMap: (activeMapResult.data ?? null) as CampaignMap | null,
        tokens,
        quests: (questsResult.data ?? []) as CampaignQuest[],
        worldEvents: (worldEventsResult.data ?? []) as CampaignWorldEvent[],
        recentEvents: (recentEventsResult.data ?? []) as CampaignEvent[],
        diceHistory: (diceHistoryResult.data ?? []) as DiceRollRow[],
        memories: (memoriesResult.data ?? []) as CampaignMemory[],
        characters,
        lore: (loreResult.data ?? []),
        factions: (factionsResult.data ?? [])
    };
};
