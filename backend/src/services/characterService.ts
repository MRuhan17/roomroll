import { supabase } from '../config/db';
import { createCampaignEvent } from './eventService';
import {
    CampaignCharacter,
    CampaignCharacterDetail,
    Character,
    CharacterAbilityScores,
    CharacterCombatStats,
    CharacterEquipment,
    CharacterEquipmentView,
    CharacterProgressionLogEntry,
    CharacterProgressionState,
    CharacterProgressionSummary,
    CharacterStatusEffect,
    EquipmentSlot,
    InventoryItem,
    InventoryItemType,
    ProgressionChangeType,
    StatusEffectDurationType,
    StatusEffectType,
} from '../types/character';

const XP_PER_LEVEL = 1000;

const DEFAULT_ABILITY_SCORES: CharacterAbilityScores = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
};

const DEFAULT_COMBAT_STATS: CharacterCombatStats = {
    hp_current: 10,
    hp_max: 10,
    armor_class: 10,
    speed: 30,
    proficiency_bonus: 2,
};

const DEFAULT_PROGRESSION_STATE: CharacterProgressionState = {
    milestones: [],
    talents: [],
    notes: [],
};

export interface CreateCharacterInput {
    campaignId: number;
    userId: number;
    name: string;
    className?: string;
    species?: string;
    background?: string;
    backstory?: string;
    isNpc?: boolean;
    level?: number;
    xp?: number;
    abilityScores?: Partial<CharacterAbilityScores>;
    combatStats?: Partial<CharacterCombatStats>;
    progressionState?: CharacterProgressionState;
    currency?: Record<string, number>;
    notes?: string;
    createdBy?: number | null;
}

export interface UpdateCharacterInput {
    name?: string;
    className?: string | null;
    species?: string | null;
    background?: string | null;
    backstory?: string | null;
    isNpc?: boolean;
    level?: number;
    xp?: number;
    abilityScores?: Partial<CharacterAbilityScores>;
    combatStats?: Partial<CharacterCombatStats>;
    progressionState?: CharacterProgressionState;
    currency?: Record<string, number>;
    notes?: string | null;
}

export interface AddInventoryItemInput {
    campaignId: number;
    characterId: number;
    name: string;
    description?: string;
    itemType?: InventoryItemType;
    rarity?: string;
    quantity?: number;
    weight?: number;
    stackable?: boolean;
    equippable?: boolean;
    itemData?: Record<string, unknown>;
}

export interface UpdateInventoryItemInput {
    name?: string;
    description?: string | null;
    itemType?: InventoryItemType;
    rarity?: string | null;
    quantity?: number;
    weight?: number | null;
    stackable?: boolean;
    equippable?: boolean;
    itemData?: Record<string, unknown>;
}

export interface EquipItemInput {
    campaignId: number;
    characterId: number;
    inventoryItemId: number;
    slot: EquipmentSlot;
}

export interface AddStatusEffectInput {
    campaignId: number;
    characterId: number;
    name: string;
    effectType: StatusEffectType;
    source?: string;
    durationType?: StatusEffectDurationType;
    durationValue?: number;
    remainingDuration?: number;
    modifiers?: Record<string, unknown>;
}

export interface UpdateStatusEffectInput {
    name?: string;
    effectType?: StatusEffectType;
    source?: string | null;
    durationType?: StatusEffectDurationType;
    durationValue?: number | null;
    remainingDuration?: number | null;
    modifiers?: Record<string, unknown>;
    isActive?: boolean;
    expiresAt?: string | null;
}

export interface AwardExperienceInput {
    campaignId: number;
    characterId: number;
    amount: number;
    reason?: string;
    metadata?: Record<string, unknown>;
    createdBy?: number | null;
}

export interface CharacterExperienceResult {
    character: CampaignCharacterDetail;
    previous_level: number;
    previous_xp: number;
    leveled_up: boolean;
    levels_gained: number;
}

export const getXpRequiredForLevel = (level: number): number => Math.max(level - 1, 0) * XP_PER_LEVEL;

export const getLevelForXp = (xp: number): number => Math.max(1, Math.floor(Math.max(xp, 0) / XP_PER_LEVEL) + 1);

export const summarizeProgression = (character: Pick<Character, 'level' | 'xp'>): CharacterProgressionSummary => {
    const xpForCurrentLevel = getXpRequiredForLevel(character.level);
    const xpForNextLevel = getXpRequiredForLevel(character.level + 1);

    return {
        level: character.level,
        xp: character.xp,
        xp_for_current_level: xpForCurrentLevel,
        xp_for_next_level: xpForNextLevel,
        xp_into_level: Math.max(character.xp - xpForCurrentLevel, 0),
    };
};

export const createCharacter = async (input: CreateCharacterInput): Promise<CampaignCharacterDetail> => {
    const xp = Math.max(input.xp ?? 0, 0);
    const derivedLevel = getLevelForXp(xp);
    const level = Math.max(input.level ?? derivedLevel, derivedLevel, 1);

    const { data, error } = await supabase
        .from('characters')
        .insert([
            {
                campaign_id: input.campaignId,
                user_id: input.userId,
                name: input.name,
                class_name: input.className ?? null,
                species: input.species ?? null,
                background: input.background ?? null,
                backstory: input.backstory ?? null,
                is_npc: input.isNpc ?? false,
                level,
                xp,
                ability_scores: mergeAbilityScores(input.abilityScores),
                combat_stats: mergeCombatStats(input.combatStats),
                progression_state: mergeProgressionState(input.progressionState),
                currency: normalizeCurrency(input.currency),
                notes: input.notes ?? null,
            },
        ])
        .select('*')
        .single();

    if (error || !data) {
        throw error ?? new Error('Failed to create character');
    }

    await createCampaignEvent(
        input.campaignId,
        'CHARACTER_CREATED',
        { characterId: data.id, ownerUserId: data.user_id, level: data.level },
        input.createdBy ?? input.userId
    );

    const character = await getCharacterById(input.campaignId, data.id);
    if (!character) {
        throw new Error('Failed to load character after creation');
    }

    return character;
};

export const listCharacters = async (campaignId: number): Promise<CampaignCharacter[]> => {
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });

    if (error) {
        throw error;
    }

    return hydrateCharacters((data ?? []) as Character[]);
};

export const getCharacterById = async (
    campaignId: number,
    characterId: number
): Promise<CampaignCharacterDetail | null> => {
    const character = await getBaseCharacter(campaignId, characterId);
    if (!character) {
        return null;
    }

    const [hydratedCharacters, progressionLogResult] = await Promise.all([
        hydrateCharacters([character]),
        supabase
            .from('character_progression_log')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('character_id', characterId)
            .order('created_at', { ascending: false })
            .limit(50),
    ]);

    if (progressionLogResult.error) {
        throw progressionLogResult.error;
    }

    return {
        ...hydratedCharacters[0],
        progression_log: (progressionLogResult.data ?? []) as CharacterProgressionLogEntry[],
    };
};

export const updateCharacter = async (
    campaignId: number,
    characterId: number,
    input: UpdateCharacterInput
) => {
    const existing = await getBaseCharacter(campaignId, characterId);
    if (!existing) {
        return null;
    }

    const nextXp = Math.max(input.xp ?? existing.xp, 0);
    const minimumLevelFromXp = getLevelForXp(nextXp);
    const nextLevel = Math.max(input.level ?? existing.level, minimumLevelFromXp, 1);

    const updates = {
        name: input.name ?? existing.name,
        class_name: input.className === undefined ? existing.class_name : input.className,
        species: input.species === undefined ? existing.species : input.species,
        background: input.background === undefined ? existing.background : input.background,
        backstory: input.backstory === undefined ? existing.backstory : input.backstory,
        is_npc: input.isNpc ?? existing.is_npc,
        level: nextLevel,
        xp: nextXp,
        ability_scores: mergeAbilityScores(input.abilityScores, existing.ability_scores),
        combat_stats: mergeCombatStats(input.combatStats, existing.combat_stats),
        progression_state: mergeProgressionState(input.progressionState, existing.progression_state),
        currency: input.currency === undefined ? existing.currency : normalizeCurrency(input.currency),
        notes: input.notes === undefined ? existing.notes : input.notes,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('campaign_id', campaignId)
        .eq('id', characterId);

    if (error) {
        throw error;
    }

    return getCharacterById(campaignId, characterId);
};

export const awardCharacterExperience = async (
    input: AwardExperienceInput
): Promise<CharacterExperienceResult> => {
    const existing = await getBaseCharacter(input.campaignId, input.characterId);
    if (!existing) {
        throw new Error('Character not found');
    }

    const previousXp = existing.xp;
    const previousLevel = existing.level;
    const nextXp = Math.max(previousXp + input.amount, 0);
    const nextLevel = Math.max(getLevelForXp(nextXp), 1);

    const { error } = await supabase
        .from('characters')
        .update({
            xp: nextXp,
            level: nextLevel,
            updated_at: new Date().toISOString(),
        })
        .eq('campaign_id', input.campaignId)
        .eq('id', input.characterId);

    if (error) {
        throw error;
    }

    const changeType: ProgressionChangeType =
        input.amount >= 0 ? 'xp_gain' : 'xp_loss';

    await recordProgressionChange({
        campaignId: input.campaignId,
        characterId: input.characterId,
        changeType,
        amount: input.amount,
        previousXp,
        newXp: nextXp,
        previousLevel,
        newLevel: nextLevel,
        reason: input.reason,
        metadata: input.metadata,
        createdBy: input.createdBy ?? null,
    });

    if (nextLevel !== previousLevel) {
        await recordProgressionChange({
            campaignId: input.campaignId,
            characterId: input.characterId,
            changeType: nextLevel > previousLevel ? 'level_up' : 'level_down',
            amount: nextLevel - previousLevel,
            previousXp,
            newXp: nextXp,
            previousLevel,
            newLevel: nextLevel,
            reason: input.reason ?? 'Level adjusted from XP change',
            metadata: input.metadata,
            createdBy: input.createdBy ?? null,
        });
    }

    await createCampaignEvent(
        input.campaignId,
        'CHARACTER_XP_UPDATED',
        {
            characterId: input.characterId,
            previousXp,
            newXp: nextXp,
            previousLevel,
            newLevel: nextLevel,
            reason: input.reason ?? null,
        },
        input.createdBy ?? null
    );

    const character = await getCharacterById(input.campaignId, input.characterId);
    if (!character) {
        throw new Error('Failed to load character after XP update');
    }

    return {
        character,
        previous_level: previousLevel,
        previous_xp: previousXp,
        leveled_up: nextLevel > previousLevel,
        levels_gained: Math.max(nextLevel - previousLevel, 0),
    };
};

export const addInventoryItem = async (input: AddInventoryItemInput): Promise<InventoryItem> => {
    const { data, error } = await supabase
        .from('inventory_items')
        .insert([
            {
                campaign_id: input.campaignId,
                character_id: input.characterId,
                name: input.name,
                description: input.description ?? null,
                item_type: input.itemType ?? 'misc',
                rarity: input.rarity ?? null,
                quantity: Math.max(input.quantity ?? 1, 0),
                weight: input.weight ?? null,
                stackable: input.stackable ?? true,
                equippable: input.equippable ?? false,
                item_data: input.itemData ?? {},
            },
        ])
        .select('*')
        .single();

    if (error || !data) {
        throw error ?? new Error('Failed to add inventory item');
    }

    return data as InventoryItem;
};

export const updateInventoryItem = async (
    campaignId: number,
    characterId: number,
    itemId: number,
    input: UpdateInventoryItemInput
): Promise<InventoryItem | null> => {
    const existing = await getInventoryItem(campaignId, characterId, itemId);
    if (!existing) {
        return null;
    }

    const { data, error } = await supabase
        .from('inventory_items')
        .update({
            name: input.name ?? existing.name,
            description: input.description === undefined ? existing.description : input.description,
            item_type: input.itemType ?? existing.item_type,
            rarity: input.rarity === undefined ? existing.rarity : input.rarity,
            quantity: input.quantity === undefined ? existing.quantity : Math.max(input.quantity, 0),
            weight: input.weight === undefined ? existing.weight : input.weight,
            stackable: input.stackable ?? existing.stackable,
            equippable: input.equippable ?? existing.equippable,
            item_data: input.itemData ?? existing.item_data,
            updated_at: new Date().toISOString(),
        })
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .eq('id', itemId)
        .select('*')
        .single();

    if (error || !data) {
        throw error ?? new Error('Failed to update inventory item');
    }

    return data as InventoryItem;
};

export const equipInventoryItem = async (input: EquipItemInput): Promise<CharacterEquipmentView> => {
    const item = await getInventoryItem(input.campaignId, input.characterId, input.inventoryItemId);
    if (!item) {
        throw new Error('Inventory item not found');
    }
    if (!item.equippable) {
        throw new Error('Inventory item is not equippable');
    }

    const removeExistingSlotResult = await supabase
        .from('character_equipment')
        .delete()
        .eq('campaign_id', input.campaignId)
        .eq('character_id', input.characterId)
        .eq('slot', input.slot);
    if (removeExistingSlotResult.error) {
        throw removeExistingSlotResult.error;
    }

    const removeExistingItemResult = await supabase
        .from('character_equipment')
        .delete()
        .eq('inventory_item_id', input.inventoryItemId);
    if (removeExistingItemResult.error) {
        throw removeExistingItemResult.error;
    }

    const { data, error } = await supabase
        .from('character_equipment')
        .insert([
            {
                campaign_id: input.campaignId,
                character_id: input.characterId,
                inventory_item_id: input.inventoryItemId,
                slot: input.slot,
            },
        ])
        .select('*')
        .single();

    if (error || !data) {
        throw error ?? new Error('Failed to equip item');
    }

    return {
        ...(data as CharacterEquipment),
        item,
    };
};

export const unequipInventoryItem = async (
    campaignId: number,
    characterId: number,
    slot: EquipmentSlot
): Promise<void> => {
    const result = await supabase
        .from('character_equipment')
        .delete()
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .eq('slot', slot);

    if (result.error) {
        throw result.error;
    }
};

export const addStatusEffect = async (input: AddStatusEffectInput): Promise<CharacterStatusEffect> => {
    const { data, error } = await supabase
        .from('character_status_effects')
        .insert([
            {
                campaign_id: input.campaignId,
                character_id: input.characterId,
                name: input.name,
                effect_type: input.effectType,
                source: input.source ?? null,
                duration_type: input.durationType ?? 'permanent',
                duration_value: input.durationValue ?? null,
                remaining_duration: input.remainingDuration ?? input.durationValue ?? null,
                modifiers: input.modifiers ?? {},
            },
        ])
        .select('*')
        .single();

    if (error || !data) {
        throw error ?? new Error('Failed to add status effect');
    }

    return data as CharacterStatusEffect;
};

export const updateStatusEffect = async (
    campaignId: number,
    characterId: number,
    effectId: number,
    input: UpdateStatusEffectInput
): Promise<CharacterStatusEffect | null> => {
    const existing = await getStatusEffect(campaignId, characterId, effectId);
    if (!existing) {
        return null;
    }

    const nextIsActive = input.isActive ?? existing.is_active;

    const { data, error } = await supabase
        .from('character_status_effects')
        .update({
            name: input.name ?? existing.name,
            effect_type: input.effectType ?? existing.effect_type,
            source: input.source === undefined ? existing.source : input.source,
            duration_type: input.durationType ?? existing.duration_type,
            duration_value: input.durationValue === undefined ? existing.duration_value : input.durationValue,
            remaining_duration:
                input.remainingDuration === undefined ? existing.remaining_duration : input.remainingDuration,
            modifiers: input.modifiers ?? existing.modifiers,
            is_active: nextIsActive,
            expires_at: input.expiresAt === undefined ? existing.expires_at : input.expiresAt,
            removed_at: nextIsActive ? null : existing.removed_at ?? new Date().toISOString(),
        })
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .eq('id', effectId)
        .select('*')
        .single();

    if (error || !data) {
        throw error ?? new Error('Failed to update status effect');
    }

    return data as CharacterStatusEffect;
};

export const removeStatusEffect = async (
    campaignId: number,
    characterId: number,
    effectId: number
): Promise<CharacterStatusEffect | null> => {
    return updateStatusEffect(campaignId, characterId, effectId, { isActive: false });
};

const hydrateCharacters = async (characters: Character[]): Promise<CampaignCharacter[]> => {
    if (characters.length === 0) {
        return [];
    }

    const characterIds = characters.map((character) => character.id);

    const [inventoryResult, equipmentResult, statusEffectsResult] = await Promise.all([
        supabase
            .from('inventory_items')
            .select('*')
            .in('character_id', characterIds)
            .order('created_at', { ascending: true }),
        supabase
            .from('character_equipment')
            .select('*')
            .in('character_id', characterIds)
            .order('equipped_at', { ascending: true }),
        supabase
            .from('character_status_effects')
            .select('*')
            .in('character_id', characterIds)
            .order('applied_at', { ascending: false }),
    ]);

    if (inventoryResult.error) {
        throw inventoryResult.error;
    }
    if (equipmentResult.error) {
        throw equipmentResult.error;
    }
    if (statusEffectsResult.error) {
        throw statusEffectsResult.error;
    }

    const inventory = (inventoryResult.data ?? []) as InventoryItem[];
    const equipment = (equipmentResult.data ?? []) as CharacterEquipment[];
    const statusEffects = (statusEffectsResult.data ?? []) as CharacterStatusEffect[];

    const inventoryByCharacterId = groupByCharacterId(inventory);
    const equipmentByCharacterId = groupByCharacterId(equipment);
    const statusEffectsByCharacterId = groupByCharacterId(statusEffects);
    const inventoryById = new Map<number, InventoryItem>(inventory.map((item) => [item.id, item]));

    return characters.map((character) => {
        const characterInventory = inventoryByCharacterId.get(character.id) ?? [];
        const characterEquipment = (equipmentByCharacterId.get(character.id) ?? []).map((entry) => ({
            ...entry,
            item: inventoryById.get(entry.inventory_item_id) ?? null,
        }));

        return {
            ...character,
            progression_summary: summarizeProgression(character),
            inventory: characterInventory,
            equipment: characterEquipment,
            status_effects: statusEffectsByCharacterId.get(character.id) ?? [],
        };
    });
};

const getBaseCharacter = async (campaignId: number, characterId: number): Promise<Character | null> => {
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('id', characterId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data ?? null) as Character | null;
};

const getInventoryItem = async (
    campaignId: number,
    characterId: number,
    itemId: number
): Promise<InventoryItem | null> => {
    const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .eq('id', itemId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data ?? null) as InventoryItem | null;
};

const getStatusEffect = async (
    campaignId: number,
    characterId: number,
    effectId: number
): Promise<CharacterStatusEffect | null> => {
    const { data, error } = await supabase
        .from('character_status_effects')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('character_id', characterId)
        .eq('id', effectId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data ?? null) as CharacterStatusEffect | null;
};

interface RecordProgressionChangeInput {
    campaignId: number;
    characterId: number;
    changeType: ProgressionChangeType;
    amount: number;
    previousXp: number;
    newXp: number;
    previousLevel: number;
    newLevel: number;
    reason?: string;
    metadata?: Record<string, unknown>;
    createdBy?: number | null;
}

const recordProgressionChange = async (input: RecordProgressionChangeInput): Promise<void> => {
    const { error } = await supabase
        .from('character_progression_log')
        .insert([
            {
                campaign_id: input.campaignId,
                character_id: input.characterId,
                change_type: input.changeType,
                amount: input.amount,
                previous_xp: input.previousXp,
                new_xp: input.newXp,
                previous_level: input.previousLevel,
                new_level: input.newLevel,
                reason: input.reason ?? null,
                metadata: input.metadata ?? {},
                created_by: input.createdBy ?? null,
            },
        ]);

    if (error) {
        throw error;
    }
};

const mergeAbilityScores = (
    input?: Partial<CharacterAbilityScores>,
    existing?: CharacterAbilityScores
): CharacterAbilityScores => ({
    ...(existing ?? DEFAULT_ABILITY_SCORES),
    ...(input ?? {}),
});

const mergeCombatStats = (
    input?: Partial<CharacterCombatStats>,
    existing?: CharacterCombatStats
): CharacterCombatStats => ({
    ...(existing ?? DEFAULT_COMBAT_STATS),
    ...(input ?? {}),
});

const mergeProgressionState = (
    input?: CharacterProgressionState,
    existing?: CharacterProgressionState
): CharacterProgressionState => ({
    ...(existing ?? DEFAULT_PROGRESSION_STATE),
    ...(input ?? {}),
    milestones: input?.milestones ?? existing?.milestones ?? DEFAULT_PROGRESSION_STATE.milestones,
    talents: input?.talents ?? existing?.talents ?? DEFAULT_PROGRESSION_STATE.talents,
    notes: input?.notes ?? existing?.notes ?? DEFAULT_PROGRESSION_STATE.notes,
});

const normalizeCurrency = (currency?: Record<string, number>): Record<string, number> => {
    if (!currency) {
        return {};
    }

    const normalized: Record<string, number> = {};
    for (const [key, value] of Object.entries(currency)) {
        if (Number.isFinite(value)) {
            normalized[key] = value;
        }
    }
    return normalized;
};

function groupByCharacterId<T extends { character_id: number }>(rows: T[]): Map<number, T[]> {
    const grouped = new Map<number, T[]>();

    for (const row of rows) {
        const existingRows = grouped.get(row.character_id);
        if (existingRows) {
            existingRows.push(row);
        } else {
            grouped.set(row.character_id, [row]);
        }
    }

    return grouped;
}
