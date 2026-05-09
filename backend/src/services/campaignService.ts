import { supabase } from '../config/db';
import { Campaign, CampaignMember } from '../types/campaign';
import { generateInviteCode } from '../utils/inviteCode';

export interface CreateCampaignInput {
    name: string;
    description?: string;
    worldType?: string;
    dmUserId: number;
}

const MAX_INVITE_CODE_GENERATION_ATTEMPTS = 5;

export const createCampaign = async (input: CreateCampaignInput): Promise<Campaign> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_INVITE_CODE_GENERATION_ATTEMPTS; attempt += 1) {
        const inviteCode = generateInviteCode();
        const { data, error } = await supabase
            .from('campaigns')
            .insert([
                {
                    name: input.name,
                    description: input.description || null,
                    world_type: input.worldType || null,
                    dm_user_id: input.dmUserId,
                    invite_code: inviteCode,
                    current_session_state: { status: 'idle', mode: 'narration' }
                }
            ])
            .select('*')
            .single();

        if (!error && data) {
            const { error: memberError } = await supabase.from('campaign_members').insert([
                {
                    campaign_id: data.id,
                    user_id: input.dmUserId,
                    role: 'DM'
                }
            ]);
            if (memberError) {
                throw memberError;
            }
            return data as Campaign;
        }
        lastError = error ?? new Error('Failed to create campaign');
    }
    throw lastError ?? new Error('Failed to create campaign');
};

export const getCampaignById = async (campaignId: number): Promise<Campaign | null> => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
    if (error) {
        return null;
    }
    return data as Campaign;
};

export const getCampaignByInviteCode = async (inviteCode: string): Promise<Campaign | null> => {
    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();
    if (error) {
        return null;
    }
    return data as Campaign;
};

export const getMember = async (campaignId: number, userId: number): Promise<CampaignMember | null> => {
    const { data, error } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .maybeSingle();
    if (error || !data) {
        return null;
    }
    return data as CampaignMember;
};

export const listMembers = async (campaignId: number): Promise<CampaignMember[]> => {
    const { data } = await supabase
        .from('campaign_members')
        .select('*')
        .eq('campaign_id', campaignId);
    return (data ?? []) as CampaignMember[];
};

export const joinCampaign = async (campaignId: number, userId: number): Promise<CampaignMember> => {
    const existing = await getMember(campaignId, userId);
    if (existing) {
        return existing;
    }
    const { data, error } = await supabase
        .from('campaign_members')
        .insert([
            {
                campaign_id: campaignId,
                user_id: userId,
                role: 'player'
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to join campaign');
    }
    return data as CampaignMember;
};

export const getUserCampaigns = async (userId: number): Promise<Campaign[]> => {
    const { data } = await supabase
        .from('campaign_members')
        .select('campaigns(*)')
        .eq('user_id', userId);
    if (!data) {
        return [];
    }
    return data
        .map((row) => (row as unknown as { campaigns?: Campaign }).campaigns)
        .filter((campaign): campaign is Campaign => Boolean(campaign));
};

export const getUserActiveCampaign = async (userId: number): Promise<Campaign | null> => {
    const { data } = await supabase
        .from('campaign_members')
        .select('campaigns(*)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    const campaign = (data as { campaigns?: Campaign } | null)?.campaigns;
    if (!campaign) {
        return null;
    }
    return campaign;
};
