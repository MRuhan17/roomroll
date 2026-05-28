import { supabase } from '../config/db';
import { Campaign, CampaignEvent, CampaignParticipant, CampaignMemory, CampaignQuest, CampaignWorldEvent } from '../types/campaign';
import { CampaignCharacter } from '../types/character';
import { DiceRollRow } from '../types/dice';
import { CampaignMap, MapToken } from '../types/map';
import { listCharacters } from './characterService';
import { createLogger } from '../lib/logger';

const logger = createLogger('campaign-state-service');


export interface CampaignSnapshot {
    campaign: Campaign | null;
    members: CampaignParticipant[];
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
    logger.info('[DB QUERY] Initiating getCampaignSnapshot', { campaignId });
    const snapshotStart = Date.now();

    const campaignStart = Date.now();
    const campaignResult = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

    if (campaignResult.error) {
        logger.error('[DB QUERY] getCampaignSnapshot: failed to fetch campaign', {
            campaignId,
            durationMs: Date.now() - campaignStart,
            error: campaignResult.error.message,
            code: campaignResult.error.code
        });
        throw campaignResult.error;
    }

    logger.info('[DB QUERY] getCampaignSnapshot: fetched base campaign', {
        campaignId,
        durationMs: Date.now() - campaignStart
    });

    const campaign = campaignResult.data as Campaign;
    const activeSessionId = campaign?.current_session_state?.session_id;

    // Parallel sub-queries
    const subQueriesStart = Date.now();

    const membersPromise = supabase
        .from('campaign_participants')
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

    let recentEventsQuery = supabase
        .from('campaign_events')
        .select('*')
        .eq('campaign_id', campaignId);

    if (activeSessionId) {
        recentEventsQuery = recentEventsQuery.eq('session_id', activeSessionId);
    } else {
        recentEventsQuery = recentEventsQuery.is('session_id', null);
    }

    const recentEventsPromise = recentEventsQuery
        .order('created_at', { ascending: false })
        .limit(50);

    const diceHistoryPromise = supabase
        .from('dice_rolls')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false })
        .limit(20);

    const memoriesPromise = (async () => {
        const memStart = Date.now();
        try {
            let memoriesQuery = supabase
                .from('campaign_memories')
                .select('*')
                .eq('campaign_id', campaignId);

            if (activeSessionId) {
                memoriesQuery = memoriesQuery.or(
                    `session_id.eq.${activeSessionId},is_emotional_moment.eq.true`
                );
            } else {
                memoriesQuery = memoriesQuery.or(
                    `session_id.is.null,is_emotional_moment.eq.true`
                );
            }
            
            const res = await memoriesQuery.order('created_at', { ascending: false }).limit(30);
            if (res.error) throw res.error;
            logger.info('[DB QUERY] Memories query standard succeeded', {
                campaignId,
                durationMs: Date.now() - memStart,
                rowCount: res.data?.length ?? 0
            });
            return res;
        } catch (err: any) {
            logger.warn('[DB] Standard memories query failed, running column-free fallback', {
                campaignId,
                durationMs: Date.now() - memStart,
                error: err.message || err
            });
            return await supabase
                .from('campaign_memories')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false })
                .limit(100);
        }
    })();

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

    logger.info('[DB QUERY] Parallel sub-queries completed', {
        campaignId,
        durationMs: Date.now() - subQueriesStart,
        results: {
            members: { count: membersResult.data?.length ?? 0, hasError: !!membersResult.error },
            activeMap: { hasData: !!activeMapResult.data, hasError: !!activeMapResult.error },
            quests: { count: questsResult.data?.length ?? 0, hasError: !!questsResult.error },
            worldEvents: { count: worldEventsResult.data?.length ?? 0, hasError: !!worldEventsResult.error },
            recentEvents: { count: recentEventsResult.data?.length ?? 0, hasError: !!recentEventsResult.error },
            diceHistory: { count: diceHistoryResult.data?.length ?? 0, hasError: !!diceHistoryResult.error },
            memories: { count: memoriesResult.data?.length ?? 0, hasError: !!memoriesResult.error },
            lore: { count: loreResult.data?.length ?? 0, hasError: !!loreResult.error },
            factions: { count: factionsResult.data?.length ?? 0, hasError: !!factionsResult.error },
            characters: { count: characters.length }
        }
    });

    let tokens: MapToken[] = [];
    if (activeMapResult.data) {
        const tokenStart = Date.now();
        const tokenResult = await supabase
            .from('map_tokens')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('map_id', activeMapResult.data.id);
        tokens = (tokenResult.data ?? []) as MapToken[];
        logger.info('[DB QUERY] Map tokens query completed', {
            campaignId,
            mapId: activeMapResult.data.id,
            durationMs: Date.now() - tokenStart,
            rowCount: tokens.length,
            hasError: !!tokenResult.error
        });
    }

    logger.info('[DB QUERY] getCampaignSnapshot completed successfully', {
        campaignId,
        totalDurationMs: Date.now() - snapshotStart
    });

    const rawMemories = (memoriesResult.data ?? []) as CampaignMemory[];
    
    // Normalize and filter memories
    const normalizedMemories = rawMemories.map(m => {
        let isEmotional = (m as any).is_emotional_moment ?? false;
        let momentType = (m as any).moment_type ?? null;
        
        if (!isEmotional && Array.isArray(m.key_facts)) {
            const fallbackObj = m.key_facts.find((fact: any) => fact && fact._is_fallback === true);
            if (fallbackObj) {
                isEmotional = fallbackObj.is_emotional_moment ?? false;
                momentType = fallbackObj.moment_type ?? null;
            }
        }
        
        return {
            ...m,
            is_emotional_moment: isEmotional,
            moment_type: momentType
        } as CampaignMemory;
    });

    const filteredMemories = normalizedMemories.filter(m => {
        const isCurrentSession = activeSessionId ? m.session_id === activeSessionId : !m.session_id;
        const isEmotional = (m as any).is_emotional_moment === true;
        return isCurrentSession || isEmotional;
    }).slice(0, 30);

    return {
        campaign,
        members: (membersResult.data ?? []) as CampaignParticipant[],
        activeMap: (activeMapResult.data ?? null) as CampaignMap | null,
        tokens,
        quests: (questsResult.data ?? []) as CampaignQuest[],
        worldEvents: (worldEventsResult.data ?? []) as CampaignWorldEvent[],
        recentEvents: (recentEventsResult.data ?? []) as CampaignEvent[],
        diceHistory: (diceHistoryResult.data ?? []) as DiceRollRow[],
        memories: filteredMemories,
        characters,
        lore: (loreResult.data ?? []),
        factions: (factionsResult.data ?? [])
    };
};
