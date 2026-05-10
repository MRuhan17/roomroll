import { supabase } from '../config/db';
import { CampaignMap } from '../types/map';

export interface CreateMapInput {
    campaignId: number;
    name: string;
    imageUrl: string;
    gridEnabled: boolean;
    gridSize?: number;
}

export const createMap = async (input: CreateMapInput): Promise<CampaignMap> => {
    const { data, error } = await supabase
        .from('campaign_maps')
        .insert([
            {
                campaign_id: input.campaignId,
                name: input.name,
                image_url: input.imageUrl,
                grid_enabled: input.gridEnabled,
                grid_size: input.gridSize ?? null,
                reveal_state: { visible: false, sections: [] }
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create map');
    }
    return data as CampaignMap;
};

export const setActiveMap = async (campaignId: number, mapId: number): Promise<void> => {
    const { error: resetError } = await supabase
        .from('campaign_maps')
        .update({ is_active: false })
        .eq('campaign_id', campaignId);
    if (resetError) {
        throw resetError;
    }

    const { error } = await supabase
        .from('campaign_maps')
        .update({ is_active: true })
        .eq('campaign_id', campaignId)
        .eq('id', mapId);

    if (error) {
        throw error;
    }

    const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ active_map_id: mapId })
        .eq('id', campaignId);
    if (campaignError) {
        throw campaignError;
    }
};

export const updateRevealState = async (
    campaignId: number,
    mapId: number,
    revealState: Record<string, unknown>
): Promise<CampaignMap> => {
    const { data, error } = await supabase
        .from('campaign_maps')
        .update({ reveal_state: revealState })
        .eq('campaign_id', campaignId)
        .eq('id', mapId)
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to update map reveal state');
    }
    return data as CampaignMap;
};
