import { supabase } from '../config/db';
import { CampaignSessionState } from '../types/campaign';
import { createCampaignEvent } from './eventService';

export const startSession = async (campaignId: number, startedBy: number): Promise<CampaignSessionState> => {
    const state: CampaignSessionState = {
        status: 'active',
        started_at: new Date().toISOString(),
        mode: 'narration'
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
        await supabase
            .from('session_logs')
            .insert([
                {
                    campaign_id: campaignId,
                    session_summary: summary,
                    narration_log: []
                }
            ]);
    }

    await createCampaignEvent(campaignId, 'SESSION_ENDED', { state }, endedBy);
    return state;
};
