import { supabase } from '../config/db';
import { CampaignWorldEvent } from '../types/campaign';
import { getActiveSessionId } from './sessionService';

export interface CreateWorldEventInput {
    campaignId: number;
    title: string;
    description?: string;
    status?: string;
    createdBy?: number | null;
}

export const createWorldEvent = async (input: CreateWorldEventInput): Promise<CampaignWorldEvent> => {
    const activeSessionId = await getActiveSessionId(input.campaignId);
    const { data, error } = await supabase
        .from('campaign_world_events')
        .insert([
            {
                campaign_id: input.campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(input.campaignId),
                title: input.title,
                description: input.description ?? null,
                status: input.status ?? 'active',
                created_by: input.createdBy ?? null
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create world event');
    }
    return data as CampaignWorldEvent;
};
