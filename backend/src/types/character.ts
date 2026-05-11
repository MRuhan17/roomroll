export type EquipmentSlot =
    | 'head'
    | 'chest'
    | 'legs'
    | 'feet'
    | 'hands'
    | 'weapon'
    | 'offhand'
    | 'accessory';

export type InventoryItemType = 'weapon' | 'armor' | 'consumable' | 'tool' | 'quest' | 'misc';
export type StatusEffectType = 'buff' | 'debuff' | 'condition' | 'neutral';
export type StatusEffectDurationType = 'rounds' | 'turns' | 'time' | 'permanent';
export type ProgressionChangeType = 'xp_gain' | 'xp_loss' | 'level_up' | 'level_down' | 'milestone' | 'respec';

export interface CharacterAbilityScores {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export interface CharacterCombatStats {
    hp_current: number;
    hp_max: number;
    armor_class: number;
    speed: number;
    proficiency_bonus: number;
    initiative_bonus?: number;
    spell_save_dc?: number;
}

export interface CharacterProgressionState {
    milestones?: string[];
    talents?: string[];
    notes?: string[];
    [key: string]: unknown;
}

export interface CharacterProgressionSummary {
    level: number;
    xp: number;
    xp_for_current_level: number;
    xp_for_next_level: number;
    xp_into_level: number;
}

export interface Character {
    id: number;
    campaign_id: number;
    user_id: number;
    name: string;
    class_name: string | null;
    species: string | null;
    background: string | null;
    backstory: string | null;
    is_npc: boolean;
    level: number;
    xp: number;
    ability_scores: CharacterAbilityScores;
    combat_stats: CharacterCombatStats;
    progression_state: CharacterProgressionState;
    currency: Record<string, number>;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface InventoryItem {
    id: number;
    campaign_id: number;
    character_id: number;
    name: string;
    description: string | null;
    item_type: InventoryItemType;
    rarity: string | null;
    quantity: number;
    weight: number | null;
    stackable: boolean;
    equippable: boolean;
    item_data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
}

export interface CharacterEquipment {
    id: number;
    campaign_id: number;
    character_id: number;
    inventory_item_id: number;
    slot: EquipmentSlot;
    equipped_at: string;
}

export interface CharacterStatusEffect {
    id: number;
    campaign_id: number;
    character_id: number;
    name: string;
    effect_type: StatusEffectType;
    source: string | null;
    duration_type: StatusEffectDurationType;
    duration_value: number | null;
    remaining_duration: number | null;
    modifiers: Record<string, unknown>;
    is_active: boolean;
    applied_at: string;
    expires_at: string | null;
    removed_at: string | null;
}

export interface CharacterProgressionLogEntry {
    id: number;
    campaign_id: number;
    character_id: number;
    change_type: ProgressionChangeType;
    amount: number;
    previous_xp: number;
    new_xp: number;
    previous_level: number;
    new_level: number;
    reason: string | null;
    metadata: Record<string, unknown>;
    created_by: number | null;
    created_at: string;
}

export interface CharacterEquipmentView extends CharacterEquipment {
    item: InventoryItem | null;
}

export interface CampaignCharacter extends Character {
    progression_summary: CharacterProgressionSummary;
    inventory: InventoryItem[];
    equipment: CharacterEquipmentView[];
    status_effects: CharacterStatusEffect[];
}

export interface CampaignCharacterDetail extends CampaignCharacter {
    progression_log: CharacterProgressionLogEntry[];
}
