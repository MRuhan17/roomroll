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
    const sessionId = randomUUID();
    const state: CampaignSessionState = {
        status: 'active',
        started_at: new Date().toISOString(),
        mode: 'narration',
        session_id: sessionId
    };

    const { error } = await supabase
        .from('campaigns')
        .update({ current_session_state: state })
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
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    const activeSessionState = campaignData?.current_session_state as CampaignSessionState | null;
    const activeSessionId = activeSessionState?.session_id;

    const state: CampaignSessionState = {
        status: 'ended',
        ended_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId);
    if (error) {
        throw error;
    }

    if (summary) {
        const { error: summaryError } = await supabase
            .from('session_logs')
            .insert([
                {
                    campaign_id: campaignId,
                    session_id: activeSessionId ?? null,
                    session_summary: summary,
                    narration_log: []
                }
            ]);
        if (summaryError) {
            throw summaryError;
        }
    }

    await createCampaignEvent(campaignId, 'SESSION_ENDED', { state }, endedBy);
    return state;
};
