import { supabase } from '../config/db';
import { CampaignEvent } from '../types/campaign';

export const createCampaignEvent = async (
    campaignId: number,
    eventType: string,
    content: Record<string, unknown> | null,
    createdBy: number | null
): Promise<CampaignEvent> => {
    const { data, error } = await supabase
        .from('campaign_events')
        .insert([
            {
                campaign_id: campaignId,
                event_type: eventType,
                content,
                created_by: createdBy
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create campaign event');
    }
    return data as CampaignEvent;
};
