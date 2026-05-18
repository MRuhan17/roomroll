import { supabase } from '../config/db';
import { CampaignQuest } from '../types/campaign';
import { getActiveSessionId } from './sessionService';

export interface UpsertQuestInput {
    campaignId: number;
    questId?: number;
    title: string;
    description?: string;
    status?: string;
    progress?: Record<string, unknown>;
}

export const upsertQuest = async (input: UpsertQuestInput): Promise<CampaignQuest> => {
    const activeSessionId = await getActiveSessionId(input.campaignId);

    if (input.questId) {
        const { data, error } = await supabase
            .from('campaign_quests')
            .update({
                title: input.title,
                description: input.description ?? null,
                status: input.status ?? 'active',
                progress: input.progress ?? null,
                updated_at: new Date().toISOString()
            })
            .eq('campaign_id', input.campaignId)
            .eq('id', input.questId)
            .select('*')
            .single();
        if (error || !data) {
            throw error ?? new Error('Failed to update quest');
        }
        return data as CampaignQuest;
    }

    const { data, error } = await supabase
        .from('campaign_quests')
        .insert([
            {
                campaign_id: input.campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(input.campaignId),
                title: input.title,
                description: input.description ?? null,
                status: input.status ?? 'active',
                progress: input.progress ?? null
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create quest');
    }
    return data as CampaignQuest;
};
