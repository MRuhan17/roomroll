import { supabase } from '../config/db';
import { CampaignMemory, SessionLog } from '../types/campaign';
import { getActiveSessionId } from './sessionService';

export interface NarrationLogEntry {
    created_at: string;
    content: string;
    created_by: number | null;
}

export const appendNarrationLog = async (
    campaignId: number,
    entry: NarrationLogEntry
): Promise<SessionLog> => {
    const activeSessionId = await getActiveSessionId(campaignId);

    let query = supabase
        .from('session_logs')
        .select('*')
        .eq('campaign_id', campaignId);

    if (activeSessionId) {
        query = query.eq('session_id', activeSessionId);
    } else {
        query = query.is('session_id', null);
    }

    const { data: existingLog } = await query
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingLog) {
        const narrationLog = Array.isArray(existingLog.narration_log)
            ? [...existingLog.narration_log, entry]
            : [entry];
        const { data, error } = await supabase
            .from('session_logs')
            .update({ narration_log: narrationLog })
            .eq('id', existingLog.id)
            .select('*')
            .single();
        if (error || !data) {
            throw error ?? new Error('Failed to append narration log');
        }
        return data as SessionLog;
    }

    const { data, error } = await supabase
        .from('session_logs')
        .insert([
            {
                campaign_id: campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(campaignId),
                session_summary: null,
                narration_log: [entry]
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create session log');
    }
    return data as SessionLog;
};

export const createCampaignMemory = async (
    campaignId: number,
    summary: string,
    keyFacts: Array<Record<string, unknown>>
): Promise<CampaignMemory> => {
    const activeSessionId = await getActiveSessionId(campaignId);
    const { data, error } = await supabase
        .from('campaign_memories')
        .insert([
            {
                campaign_id: campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(campaignId),
                summary,
                key_facts: keyFacts
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create campaign memory');
    }
    return data as CampaignMemory;
};
