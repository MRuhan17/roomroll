export interface CampaignMap {
    id: number;
    campaign_id: number;
    name: string;
    image_url: string;
    grid_enabled: boolean;
    grid_size: number | null;
    reveal_state: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
}

export interface MapToken {
    id: number;
    campaign_id: number;
    map_id: number;
    token_type: 'player' | 'enemy' | 'npc' | 'boss';
    label: string | null;
    hp_current: number | null;
    hp_max: number | null;
    position: MapTokenPosition;
    is_hidden: boolean;
    created_at: string;
    updated_at: string;
}

export interface MapTokenPosition {
    x: number;
    y: number;
    snapped?: boolean;
}
