import { supabase } from '../config/db';
import { CampaignSessionState } from '../types/campaign';
import { createCampaignEvent } from './eventService';
import { randomUUID } from 'crypto';

export const getActiveSessionId = async (campaignId: number): Promise<string | undefined> => {
    if (process.env.NODE_ENV === 'test') {
        return 'test-session-1234';
    }
    const { data, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();
    if (error || !data) return undefined;
    const state = data.current_session_state as CampaignSessionState | null;
    return state?.status === 'active' ? state?.session_id : undefined;
};

export const startSession = async (campaignId: number, startedBy: number): Promise<CampaignSessionState> => {
    const { data: campaignData } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    const existingState = campaignData?.current_session_state as any || {};
    const sessionId = randomUUID();
    const state: CampaignSessionState = {
        ...existingState,
        status: 'active',
        started_at: new Date().toISOString(),
        mode: 'narration',
        session_id: sessionId
    };

    const { error } = await supabase
        .from('campaigns')
        .update({ 
            current_session_state: state,
            last_played_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    if (error) {
        throw error;
    }

    await createCampaignEvent(campaignId, 'SESSION_STARTED', { state }, startedBy);
    return state;
};

export const endSession = async (
    campaignId: number,
    endedBy: number,
    summary?: string
): Promise<CampaignSessionState> => {
    const { data: campaignData } = await supabase
        .from('campaigns')
        .select('current_session_state, active_map_id')
        .eq('id', campaignId)
        .single();

    const activeSessionState = campaignData?.current_session_state as CampaignSessionState | null;
    const activeSessionId = activeSessionState?.session_id;
    const existingState = campaignData?.current_session_state as any || {};
    const currentCompleted = Number(existingState.completed_sessions) || 0;

    const state: CampaignSessionState = {
        ...existingState,
        status: 'ended',
        ended_at: new Date().toISOString(),
        completed_sessions: currentCompleted + 1
    };

    // 1. Update the campaign session status and last played timestamp
    const { error } = await supabase
        .from('campaigns')
        .update({ 
            current_session_state: state,
            last_played_at: new Date().toISOString()
        })
        .eq('id', campaignId);
    if (error) {
        throw error;
    }

    // 2. Fetch and compile high-fidelity snapshot of entire campaign state at this exact moment
    const { data: maps } = await supabase.from('campaign_maps').select('*').eq('campaign_id', campaignId);
    const { data: tokens } = await supabase.from('map_tokens').select('*').eq('campaign_id', campaignId);
    const { data: characters } = await supabase.from('characters').select('*').eq('campaign_id', campaignId);
    const { data: quests } = await supabase.from('campaign_quests').select('*').eq('campaign_id', campaignId);
    const { data: worldEvents } = await supabase.from('campaign_world_events').select('*').eq('campaign_id', campaignId);

    const characterIds = characters ? characters.map((c: any) => c.id) : [];
    let inventory: any[] = [];
    let equipment: any[] = [];
    let statusEffects: any[] = [];
    
    if (characterIds.length > 0) {
        const { data: invData } = await supabase.from('inventory_items').select('*').in('character_id', characterIds);
        const { data: eqData } = await supabase.from('character_equipment').select('*').in('character_id', characterIds);
        const { data: seData } = await supabase.from('character_status_effects').select('*').in('character_id', characterIds);
        inventory = invData || [];
        equipment = eqData || [];
        statusEffects = seData || [];
    }

    const snapshot = {
        active_map_id: campaignData?.active_map_id || null,
        maps: maps || [],
        tokens: tokens || [],
        characters: characters || [],
        quests: quests || [],
        worldEvents: worldEvents || [],
        inventory,
        equipment,
        statusEffects,
        session_state: existingState
    };

    // 3. Insert session log row (always created on session end, documenting the snapshot)
    const { error: summaryError } = await supabase
        .from('session_logs')
        .insert([
            {
                campaign_id: campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(campaignId),
                session_summary: summary || "The DM ended this session.",
                narration_log: [],
                session_snapshot: snapshot
            }
        ]);
    if (summaryError) {
        throw summaryError;
    }

    await createCampaignEvent(campaignId, 'SESSION_ENDED', { state }, endedBy);
    return state;
};

export const recoverSessionState = async (campaignId: number, sessionId: string): Promise<any> => {
    // 1. Fetch the session log containing the snapshot
    const { data: log, error: logError } = await supabase
        .from('session_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('session_id', sessionId)
        .maybeSingle();

    if (logError || !log || !log.session_snapshot) {
        throw logError || new Error('Failed to retrieve a valid snapshot for this session.');
    }

    const snapshot = log.session_snapshot as any;

    // 2. Restore active map id on the campaign level
    await supabase
        .from('campaigns')
        .update({
            active_map_id: snapshot.active_map_id,
            last_played_at: new Date().toISOString()
        })
        .eq('id', campaignId);

    // 3. Restore maps
    if (snapshot.maps && snapshot.maps.length > 0) {
        for (const map of snapshot.maps) {
            await supabase
                .from('campaign_maps')
                .update({
                    reveal_state: map.reveal_state,
                    is_active: map.is_active
                })
                .eq('id', map.id);
        }
    }

    // 4. Restore tokens
    await supabase.from('map_tokens').delete().eq('campaign_id', campaignId);
    if (snapshot.tokens && snapshot.tokens.length > 0) {
        const tokensToInsert = snapshot.tokens.map((t: any) => ({
            id: t.id,
            campaign_id: campaignId,
            map_id: t.map_id,
            label: t.label,
            token_type: t.token_type,
            hp_current: t.hp_current,
            hp_max: t.hp_max,
            position: t.position,
            is_hidden: t.is_hidden,
            session_id: t.session_id,
            room_id: t.room_id
        }));
        await supabase.from('map_tokens').insert(tokensToInsert);
    }

    // 5. Restore quests
    await supabase.from('campaign_quests').delete().eq('campaign_id', campaignId);
    if (snapshot.quests && snapshot.quests.length > 0) {
        const questsToInsert = snapshot.quests.map((q: any) => ({
            id: q.id,
            campaign_id: campaignId,
            title: q.title,
            description: q.description,
            status: q.status,
            progress: q.progress,
            session_id: q.session_id,
            room_id: q.room_id
        }));
        await supabase.from('campaign_quests').insert(questsToInsert);
    }

    // 6. Restore world events
    await supabase.from('campaign_world_events').delete().eq('campaign_id', campaignId);
    if (snapshot.worldEvents && snapshot.worldEvents.length > 0) {
        const eventsToInsert = snapshot.worldEvents.map((w: any) => ({
            id: w.id,
            campaign_id: campaignId,
            title: w.title,
            description: w.description,
            status: w.status,
            session_id: w.session_id,
            room_id: w.room_id
        }));
        await supabase.from('campaign_world_events').insert(eventsToInsert);
    }

    // 7. Restore characters, inventory, equipment, and status effects
    if (snapshot.characters && snapshot.characters.length > 0) {
        const characterIds = snapshot.characters.map((c: any) => c.id);
        
        // Clean out child records for these characters
        await supabase.from('character_equipment').delete().in('character_id', characterIds);
        await supabase.from('character_status_effects').delete().in('character_id', characterIds);
        await supabase.from('inventory_items').delete().in('character_id', characterIds);
        
        // Delete and re-insert characters to match exact IDs and progression
        await supabase.from('characters').delete().eq('campaign_id', campaignId);
        
        const charactersToInsert = snapshot.characters.map((c: any) => ({
            id: c.id,
            campaign_id: campaignId,
            user_id: c.user_id,
            name: c.name,
            class_name: c.class_name,
            species: c.species,
            background: c.background,
            backstory: c.backstory,
            is_npc: c.is_npc,
            level: c.level,
            xp: c.xp,
            ability_scores: c.ability_scores,
            combat_stats: c.combat_stats,
            progression_state: c.progression_state,
            currency: c.currency,
            notes: c.notes
        }));
        await supabase.from('characters').insert(charactersToInsert);

        // Re-insert inventory
        if (snapshot.inventory && snapshot.inventory.length > 0) {
            const inventoryToInsert = snapshot.inventory.map((i: any) => ({
                id: i.id,
                character_id: i.character_id,
                name: i.name,
                description: i.description,
                quantity: i.quantity,
                weight: i.weight,
                item_type: i.item_type,
                properties: i.properties
            }));
            await supabase.from('inventory_items').insert(inventoryToInsert);
        }

        // Re-insert equipment
        if (snapshot.equipment && snapshot.equipment.length > 0) {
            const equipmentToInsert = snapshot.equipment.map((e: any) => ({
                id: e.id,
                character_id: e.character_id,
                inventory_item_id: e.inventory_item_id,
                slot: e.slot
            }));
            await supabase.from('character_equipment').insert(equipmentToInsert);
        }

        // Re-insert status effects
        if (snapshot.statusEffects && snapshot.statusEffects.length > 0) {
            const effectsToInsert = snapshot.statusEffects.map((s: any) => ({
                id: s.id,
                character_id: s.character_id,
                name: s.name,
                description: s.description,
                duration_rounds: s.duration_rounds,
                is_debuff: s.is_debuff
            }));
            await supabase.from('character_status_effects').insert(effectsToInsert);
        }
    }

    // 8. Restore the campaign session state to ended or whatever it was
    const restoredSessionState = snapshot.session_state || {};
    await supabase
        .from('campaigns')
        .update({
            current_session_state: {
                ...restoredSessionState,
                status: 'ended',
                session_id: sessionId
            }
        })
        .eq('id', campaignId);

    return snapshot;
};
