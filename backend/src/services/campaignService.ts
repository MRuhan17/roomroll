import { supabase } from '../config/db';
import { Campaign, CampaignParticipant } from '../types/campaign';
import { generateInviteCode } from '../utils/inviteCode';
import { createLogger } from '../lib/logger';

const logger = createLogger('campaign-service');


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
            const { error: memberError } = await supabase.from('campaign_participants').insert([
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

export const getMember = async (campaignId: number, userId: number): Promise<CampaignParticipant | null> => {
    const { data: member, error } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', userId)
        .maybeSingle();

    // Check if the user is the campaign creator/DM
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('dm_user_id')
        .eq('id', campaignId)
        .maybeSingle();

    if (campaign && campaign.dm_user_id === userId) {
        return {
            id: member?.id ?? 0,
            campaign_id: campaignId,
            user_id: userId,
            role: 'DM',
            joined_at: member?.joined_at ?? new Date().toISOString()
        } as CampaignParticipant;
    }

    if (error || !member) {
        return null;
    }
    return member as CampaignParticipant;
};

export const listMembers = async (campaignId: number): Promise<CampaignParticipant[]> => {
    const { data } = await supabase
        .from('campaign_participants')
        .select('*')
        .eq('campaign_id', campaignId);
    return (data ?? []) as CampaignParticipant[];
};

export const joinCampaign = async (campaignId: number, userId: number): Promise<CampaignParticipant> => {
    const existing = await getMember(campaignId, userId);
    if (existing) {
        return existing;
    }
    const { data, error } = await supabase
        .from('campaign_participants')
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
    return data as CampaignParticipant;
};

export const getUserCampaigns = async (userId: number): Promise<Campaign[]> => {
    logger.info('[DB QUERY] Executing getUserCampaigns', { userId, table: 'campaigns' });
    const startTime = Date.now();

    const { data: memberships, error: membershipError } = await supabase
        .from('campaign_participants')
        .select('campaign_id')
        .eq('user_id', userId);

    if (membershipError) {
        const duration = Date.now() - startTime;
        logger.error('[DB QUERY] getUserCampaigns membership lookup failed', {
            userId,
            durationMs: duration,
            error: membershipError.message,
            code: membershipError.code
        });
        throw membershipError;
    }

    const participantCampaignIds = Array.from(
        new Set((memberships ?? []).map((membership: any) => Number(membership.campaign_id)).filter(Boolean))
    );

    const filters = [`dm_user_id.eq.${userId}`];
    if (participantCampaignIds.length > 0) {
        filters.push(`id.in.(${participantCampaignIds.join(',')})`);
    }

    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .or(filters.join(','));

    const duration = Date.now() - startTime;

    if (error) {
        logger.error('[DB QUERY] getUserCampaigns failed', {
            userId,
            durationMs: duration,
            error: error.message,
            code: error.code
        });
        throw error;
    }

    const campaigns = (data ?? []) as Campaign[];

    logger.info('[DB QUERY] getUserCampaigns succeeded', {
        userId,
        durationMs: duration,
        rowCount: campaigns.length
    });

    return campaigns;
};

export const getUserActiveCampaign = async (userId: number): Promise<Campaign | null> => {
    logger.info('[DB QUERY] Executing getUserActiveCampaign', { userId, table: 'campaigns' });
    const startTime = Date.now();

    const { data: membership, error: membershipError } = await supabase
        .from('campaign_participants')
        .select('campaign_id, joined_at')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (membershipError) {
        const duration = Date.now() - startTime;
        logger.error('[DB QUERY] getUserActiveCampaign membership lookup failed', {
            userId,
            durationMs: duration,
            error: membershipError.message,
            code: membershipError.code
        });
        throw membershipError;
    }

    if (!membership) {
        const { data: ownedCampaign, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('dm_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const duration = Date.now() - startTime;

        if (error) {
            logger.error('[DB QUERY] getUserActiveCampaign failed', {
                userId,
                durationMs: duration,
                error: error.message,
                code: error.code
            });
            throw error;
        }

        logger.info('[DB QUERY] getUserActiveCampaign succeeded', {
            userId,
            durationMs: duration,
            hasData: !!ownedCampaign
        });

        return (ownedCampaign as Campaign | null) ?? null;
    }

    const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', membership.campaign_id)
        .maybeSingle();

    const duration = Date.now() - startTime;

    if (error) {
        logger.error('[DB QUERY] getUserActiveCampaign failed', {
            userId,
            durationMs: duration,
            error: error.message,
            code: error.code
        });
        throw error;
    }

    logger.info('[DB QUERY] getUserActiveCampaign succeeded', {
        userId,
        durationMs: duration,
        hasData: !!data
    });

    return (data as Campaign | null) ?? null;
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
