import { supabase } from '../config/db';
import { Campaign, CampaignMember } from '../types/campaign';
import { generateInviteCode } from '../utils/inviteCode';

export interface CreateCampaignInput {
    name: string;
    description?: string;
    worldType?: string;
    dmUserId: number;
    playMode?: 'human_dm' | 'player_only' | 'ai_dm';
    genre?: string;
    tone?: string;
    storyFootnotes?: string;
    guidance?: {
        important_locations?: string;
        forbidden_lore?: string;
        campaign_objectives?: string;
        recurring_villains?: string;
        faction_conflicts?: string;
        emotional_themes?: string;
    };
    targetSessions?: number;
    pacingIntensity?: 'auto' | 'slow' | 'balanced' | 'fast';
    criticalArcs?: string[];
}

const MAX_INVITE_CODE_COLLISION_RETRIES = 5;

export const createCampaign = async (input: CreateCampaignInput): Promise<Campaign> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_INVITE_CODE_COLLISION_RETRIES; attempt += 1) {
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
                    current_session_state: { 
                        status: 'idle', 
                        mode: 'narration',
                        play_mode: input.playMode || 'human_dm',
                        genre: input.genre || 'High Fantasy',
                        tone: input.tone || 'cinematic',
                        story_footnotes: input.storyFootnotes || '',
                        guidance: input.guidance || {},
                        target_sessions: input.targetSessions || 5,
                        completed_sessions: 0,
                        pacing_intensity: input.pacingIntensity || 'balanced',
                        critical_arcs: input.criticalArcs || []
                    }
                }
            ])
            .select('*')
            .single();

        if (!error && data) {
            const { error: memberError } = await supabase.from('campaign_members').insert([
                {
                    campaign_id: data.id,
                    user_id: input.dmUserId,
                    role: input.playMode === 'human_dm' ? 'DM' : 'player'
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
    const campaigns: Campaign[] = [];
    for (const row of data) {
        if (row && typeof row === 'object' && 'campaigns' in row) {
            const campaignsValue = (row as { campaigns?: unknown }).campaigns;
            if (Array.isArray(campaignsValue)) {
                for (const campaign of campaignsValue) {
                    if (isCampaign(campaign)) {
                        campaigns.push(campaign);
                    }
                }
            } else if (isCampaign(campaignsValue)) {
                campaigns.push(campaignsValue);
            }
        }
    }
    return campaigns;
};

export const getUserActiveCampaign = async (userId: number): Promise<Campaign | null> => {
    const { data } = await supabase
        .from('campaign_members')
        .select('campaigns(*)')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    const campaignsValue = data && typeof data === 'object' && 'campaigns' in data
        ? (data as { campaigns?: unknown }).campaigns
        : undefined;
    const campaign = Array.isArray(campaignsValue)
        ? campaignsValue.find((item) => isCampaign(item))
        : isCampaign(campaignsValue)
            ? campaignsValue
            : undefined;
    if (!campaign) {
        return null;
    }
    return campaign;
};

const isCampaign = (value: unknown): value is Campaign => {
    return Boolean(
        value &&
            typeof value === 'object' &&
            'id' in value &&
            'name' in value &&
            'invite_code' in value
    );
};
