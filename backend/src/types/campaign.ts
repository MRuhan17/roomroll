export interface Campaign {
    id: number;
    name: string;
    description: string | null;
    world_type: string | null;
    dm_user_id: number;
    invite_code: string;
    active_map_id: number | null;
    current_session_state: CampaignSessionState | null;
    created_at: string;
}

export interface CampaignSessionState {
    status?: 'idle' | 'active' | 'ended';
    started_at?: string;
    ended_at?: string;
    mode?: 'narration' | 'tactical';
    active_scene?: string;
}

export interface CampaignMember {
    id: number;
    campaign_id: number;
    user_id: number;
    role: 'DM' | 'player';
    joined_at: string;
}

export interface CampaignEvent {
    id: number;
    campaign_id: number;
    event_type: string;
    content: Record<string, unknown> | null;
    created_by: number | null;
    created_at: string;
}

export interface SessionLog {
    id: number;
    campaign_id: number;
    session_summary: string | null;
    narration_log: Array<Record<string, unknown>> | null;
    created_at: string;
}

export interface CampaignWorldEvent {
    id: number;
    campaign_id: number;
    title: string;
    description: string | null;
    status: string;
    created_by: number | null;
    created_at: string;
}

export interface CampaignQuest {
    id: number;
    campaign_id: number;
    title: string;
    description: string | null;
    status: string;
    progress: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface CampaignMemory {
    id: number;
    campaign_id: number;
    summary: string;
    key_facts: Array<Record<string, unknown>> | null;
    created_at: string;
    updated_at: string;
}
