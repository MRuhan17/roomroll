import { Request, Response } from 'express';
import {
    addInventoryItem,
    addStatusEffect,
    awardCharacterExperience,
    createCharacter,
    equipInventoryItem,
    getCharacterById,
    listCharacters,
    removeStatusEffect,
    unequipInventoryItem,
    updateCharacter,
    updateInventoryItem,
    updateStatusEffect,
} from '../services/characterService';
import { getMember } from '../services/campaignService';
import { CampaignParticipant } from '../types/campaign';
import { EquipmentSlot } from '../types/character';

export const listCharactersHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    try {
        const characters = await listCharacters(campaignId);
        return res.json({ characters });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch characters' });
    }
};

export const createCharacterHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    if (!campaignId) {
        return res.status(400).json({ message: 'Campaign ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const {
        userId,
        name,
        className,
        species,
        background,
        backstory,
        isNpc,
        level,
        xp,
        abilityScores,
        combatStats,
        progressionState,
        currency,
        notes,
    } = req.body as {
        userId?: number;
        name?: string;
        className?: string;
        species?: string;
        background?: string;
        backstory?: string;
        isNpc?: boolean;
        level?: number;
        xp?: number;
        abilityScores?: Record<string, number>;
        combatStats?: Record<string, number>;
        progressionState?: Record<string, unknown>;
        currency?: Record<string, number>;
        notes?: string;
    };

    if (!name) {
        return res.status(400).json({ message: 'Character name is required' });
    }

    const ownerUserId = resolveOwnerUserId(member, user.id, userId);
    if (!ownerUserId) {
        return res.status(403).json({ message: 'Only the DM can assign another player to a character' });
    }

    const ownerMembership = await getMember(campaignId, ownerUserId);
    if (!ownerMembership) {
        return res.status(400).json({ message: 'Character owner must be a campaign member' });
    }

    try {
        const character = await createCharacter({
            campaignId,
            userId: ownerUserId,
            name,
            className,
            species,
            background,
            backstory,
            isNpc,
            level,
            xp,
            abilityScores,
            combatStats,
            progressionState,
            currency,
            notes,
            createdBy: user.id,
        });

        return res.status(201).json({ character });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to create character' });
    }
};

export const getCharacterHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    if (!campaignId || !characterId) {
        return res.status(400).json({ message: 'Campaign ID and character ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    try {
        const character = await getCharacterById(campaignId, characterId);
        if (!character) {
            return res.status(404).json({ message: 'Character not found' });
        }
        return res.json({ character });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to fetch character' });
    }
};

export const updateCharacterHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    if (!campaignId || !characterId) {
        return res.status(400).json({ message: 'Campaign ID and character ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can update this character' });
    }

    try {
        const updatedCharacter = await updateCharacter(campaignId, characterId, req.body);
        return res.json({ character: updatedCharacter });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update character' });
    }
};

export const awardExperienceHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    const { amount, reason, metadata } = req.body as {
        amount?: number;
        reason?: string;
        metadata?: Record<string, unknown>;
    };

    if (!campaignId || !characterId || typeof amount !== 'number') {
        return res.status(400).json({ message: 'Campaign ID, character ID, and XP amount required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member || member.role !== 'DM') {
        return res.status(403).json({ message: 'DM role required' });
    }

    try {
        const result = await awardCharacterExperience({
            campaignId,
            characterId,
            amount,
            reason,
            metadata,
            createdBy: user.id,
        });

        return res.json(result);
    } catch (error) {
        const message = getErrorMessage(error);
        if (message === 'Character not found') {
            return res.status(404).json({ message });
        }
        return res.status(500).json({ message: 'Failed to update character XP' });
    }
};

export const addInventoryItemHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    if (!campaignId || !characterId) {
        return res.status(400).json({ message: 'Campaign ID and character ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage inventory' });
    }

    const { name, description, itemType, rarity, quantity, weight, stackable, equippable, itemData } = req.body as {
        name?: string;
        description?: string;
        itemType?: 'weapon' | 'armor' | 'consumable' | 'tool' | 'quest' | 'misc';
        rarity?: string;
        quantity?: number;
        weight?: number;
        stackable?: boolean;
        equippable?: boolean;
        itemData?: Record<string, unknown>;
    };

    if (!name) {
        return res.status(400).json({ message: 'Inventory item name is required' });
    }

    try {
        const item = await addInventoryItem({
            campaignId,
            characterId,
            name,
            description,
            itemType,
            rarity,
            quantity,
            weight,
            stackable,
            equippable,
            itemData,
        });

        return res.status(201).json({ item });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add inventory item' });
    }
};

export const updateInventoryItemHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    const itemId = Number(req.params.itemId);
    if (!campaignId || !characterId || !itemId) {
        return res.status(400).json({ message: 'Campaign ID, character ID, and item ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage inventory' });
    }

    try {
        const item = await updateInventoryItem(campaignId, characterId, itemId, req.body);
        if (!item) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }
        return res.json({ item });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update inventory item' });
    }
};

export const equipInventoryItemHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    const { inventoryItemId, slot } = req.body as { inventoryItemId?: number; slot?: EquipmentSlot };
    if (!campaignId || !characterId || !inventoryItemId || !slot) {
        return res.status(400).json({ message: 'Campaign ID, character ID, inventory item ID, and slot required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage equipment' });
    }

    try {
        const equipment = await equipInventoryItem({
            campaignId,
            characterId,
            inventoryItemId,
            slot,
        });

        return res.json({ equipment });
    } catch (error) {
        const message = getErrorMessage(error);
        if (message === 'Inventory item not found' || message === 'Inventory item is not equippable') {
            return res.status(400).json({ message });
        }
        return res.status(500).json({ message: 'Failed to equip inventory item' });
    }
};

export const unequipInventoryItemHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    const slot = req.params.slot as EquipmentSlot;
    if (!campaignId || !characterId || !slot) {
        return res.status(400).json({ message: 'Campaign ID, character ID, and slot required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage equipment' });
    }

    try {
        await unequipInventoryItem(campaignId, characterId, slot);
        return res.json({ status: 'ok' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to unequip inventory item' });
    }
};

export const addStatusEffectHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    if (!campaignId || !characterId) {
        return res.status(400).json({ message: 'Campaign ID and character ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage status effects' });
    }

    const { name, effectType, source, durationType, durationValue, remainingDuration, modifiers } = req.body as {
        name?: string;
        effectType?: 'buff' | 'debuff' | 'condition' | 'neutral';
        source?: string;
        durationType?: 'rounds' | 'turns' | 'time' | 'permanent';
        durationValue?: number;
        remainingDuration?: number;
        modifiers?: Record<string, unknown>;
    };

    if (!name || !effectType) {
        return res.status(400).json({ message: 'Status effect name and effectType are required' });
    }

    try {
        const effect = await addStatusEffect({
            campaignId,
            characterId,
            name,
            effectType,
            source,
            durationType,
            durationValue,
            remainingDuration,
            modifiers,
        });

        return res.status(201).json({ effect });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to add status effect' });
    }
};

export const updateStatusEffectHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    const effectId = Number(req.params.effectId);
    if (!campaignId || !characterId || !effectId) {
        return res.status(400).json({ message: 'Campaign ID, character ID, and effect ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage status effects' });
    }

    try {
        const effect = await updateStatusEffect(campaignId, characterId, effectId, req.body);
        if (!effect) {
            return res.status(404).json({ message: 'Status effect not found' });
        }
        return res.json({ effect });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to update status effect' });
    }
};

export const removeStatusEffectHandler = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const campaignId = Number(req.params.campaignId);
    const characterId = Number(req.params.characterId);
    const effectId = Number(req.params.effectId);
    if (!campaignId || !characterId || !effectId) {
        return res.status(400).json({ message: 'Campaign ID, character ID, and effect ID required' });
    }

    const member = await getMember(campaignId, user.id);
    if (!member) {
        return res.status(403).json({ message: 'Not a campaign member' });
    }

    const character = await getCharacterById(campaignId, characterId);
    if (!character) {
        return res.status(404).json({ message: 'Character not found' });
    }

    if (!canManageCharacter(member, character.user_id, user.id)) {
        return res.status(403).json({ message: 'Only the character owner or DM can manage status effects' });
    }

    try {
        const effect = await removeStatusEffect(campaignId, characterId, effectId);
        if (!effect) {
            return res.status(404).json({ message: 'Status effect not found' });
        }
        return res.json({ effect });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to remove status effect' });
    }
};

const resolveOwnerUserId = (member: CampaignParticipant, requesterUserId: number, requestedUserId?: number): number | null => {
    if (member.role === 'DM') {
        return requestedUserId ?? requesterUserId;
    }

    if (requestedUserId && requestedUserId !== requesterUserId) {
        return null;
    }

    return requesterUserId;
};

const canManageCharacter = (member: CampaignParticipant, characterOwnerUserId: number, requesterUserId: number): boolean => {
    return member.role === 'DM' || characterOwnerUserId === requesterUserId;
};

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown error';
};
