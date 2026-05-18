import { supabase } from '../config/db';
import { MapToken, MapTokenPosition } from '../types/map';
import { getActiveSessionId } from './sessionService';

export interface CreateTokenInput {
    campaignId: number;
    mapId: number;
    tokenType: MapToken['token_type'];
    label?: string;
    hpCurrent?: number;
    hpMax?: number;
    position: MapTokenPosition;
    isHidden?: boolean;
}

export const createToken = async (input: CreateTokenInput): Promise<MapToken> => {
    const activeSessionId = await getActiveSessionId(input.campaignId);
    const { data, error } = await supabase
        .from('map_tokens')
        .insert([
            {
                campaign_id: input.campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(input.campaignId),
                map_id: input.mapId,
                token_type: input.tokenType,
                label: input.label ?? null,
                hp_current: input.hpCurrent ?? null,
                hp_max: input.hpMax ?? null,
                position: input.position,
                is_hidden: input.isHidden ?? false
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to create token');
    }
    return data as MapToken;
};

export const moveToken = async (
    campaignId: number,
    tokenId: number,
    position: MapTokenPosition
): Promise<MapToken> => {
    const { data, error } = await supabase
        .from('map_tokens')
        .update({ position, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .eq('id', tokenId)
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to move token');
    }
    return data as MapToken;
};

export const updateToken = async (
    campaignId: number,
    tokenId: number,
    updates: Partial<Pick<MapToken, 'hp_current' | 'hp_max' | 'label' | 'is_hidden'>>
): Promise<MapToken> => {
    const { data, error } = await supabase
        .from('map_tokens')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('campaign_id', campaignId)
        .eq('id', tokenId)
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to update token');
    }
    return data as MapToken;
};

export const deleteToken = async (
    campaignId: number,
    tokenId: number
): Promise<void> => {
    const { error } = await supabase
        .from('map_tokens')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('id', tokenId);
    if (error) {
        throw error;
    }
};
