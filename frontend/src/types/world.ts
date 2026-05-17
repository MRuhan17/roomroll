export interface LoreEntry {
    id: number;
    campaign_id: number;
    title: string;
    category: string;
    content: string;
    is_secret: boolean;
    is_discovered: boolean;
    created_at: string;
    updated_at: string;
}

export interface Faction {
    id: number;
    campaign_id: number;
    name: string;
    description: string;
    leader: string;
    relationships: Record<string, string>;
    is_discovered: boolean;
    created_at: string;
    updated_at: string;
}

export interface Discovery {
    id: number;
    campaign_id: number;
    entity_type: 'lore' | 'faction' | 'event';
    entity_id: number;
    discovered_by: number | null;
    discovered_at: string;
    users?: {
        display_name: string;
    };
}

export interface WorldEvent {
    id: number;
    campaign_id: number;
    title: string;
    description: string;
    status: string;
    created_by: number | null;
    created_at: string;
}

export interface WorldData {
    lore: LoreEntry[];
    factions: Faction[];
    discoveries: Discovery[];
    worldEvents: WorldEvent[];
}
