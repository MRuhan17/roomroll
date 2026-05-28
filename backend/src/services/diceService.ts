import { supabase } from '../config/db';
import { AdvantageState, DiceRollRequest, DiceRollResult, DiceRollRow, DiceType } from '../types/dice';
import { rollDie } from '../utils/dice';
import { getActiveSessionId } from './sessionService';
import { CampaignSnapshot } from './campaignStateService';

const diceSides: Record<DiceType, number> = {
    d4: 4,
    d6: 6,
    d8: 8,
    d10: 10,
    d12: 12,
    d20: 20,
    d100: 100
};

export const isDiceType = (value: string): value is DiceType => {
    return Object.keys(diceSides).includes(value);
};

export const rollDice = (request: DiceRollRequest): DiceRollResult => {
    const sides = diceSides[request.diceType];
    const modifier = request.modifier ?? 0;
    const advantageState: AdvantageState = request.advantageState ?? 'normal';

    let rolls: number[] = [];
    if (advantageState === 'advantage' || advantageState === 'disadvantage') {
        rolls = [rollDie(sides), rollDie(sides)];
    } else {
        rolls = [rollDie(sides)];
    }

    let result = rolls[0];
    if (advantageState === 'advantage') {
        result = Math.max(...rolls);
    }
    if (advantageState === 'disadvantage') {
        result = Math.min(...rolls);
    }

    const total = result + modifier;
    const isCriticalSuccess = request.diceType === 'd20' && result === 20;
    const isCriticalFail = request.diceType === 'd20' && result === 1;

    return {
        diceType: request.diceType,
        rolls,
        result,
        modifier,
        total,
        advantageState,
        isCriticalSuccess,
        isCriticalFail
    };
};

export interface RollClassification {
    tier: 'standard' | 'impactful' | 'critical' | 'legendary';
    emotionalMoment?: 'clutch_save' | 'near_death_recovery' | 'betrayal' | 'final_blow' | 'impossible_success' | 'devastating_failure' | 'campaign_defining' | null;
    isLegendary: boolean;
}

export const classifyRollImpact = (
    roll: DiceRollResult,
    context?: string,
    snapshot?: CampaignSnapshot
): RollClassification => {
    const ctx = (context || '').toLowerCase();
    const isD20 = roll.diceType === 'd20';
    
    // 1. Detect natural critical outcomes
    const isCriticalSuccess = isD20 && roll.result === 20;
    const isCriticalFail = isD20 && roll.result === 1;
    
    // Check if there is an active boss token in the active tactical map
    const hasBossActive = snapshot?.tokens?.some(token => token.token_type === 'boss' && !token.is_hidden) ?? false;
    
    const isHighStakesContext = 
        ctx.includes('death save') || 
        ctx.includes('resurrection') || 
        ctx.includes('revive') || 
        ctx.includes('stabilize') || 
        ctx.includes('boss') || 
        ctx.includes('climax') || 
        ctx.includes('final blow') || 
        ctx.includes('betray') ||
        ctx.includes('saving throw') ||
        hasBossActive;

    let tier: 'standard' | 'impactful' | 'critical' | 'legendary' = 'standard';
    let emotionalMoment: RollClassification['emotionalMoment'] = null;

    if (isCriticalSuccess || isCriticalFail) {
        if (isHighStakesContext) {
            tier = 'legendary';
            emotionalMoment = isCriticalSuccess ? 'campaign_defining' : 'devastating_failure';
        } else {
            tier = 'critical';
            emotionalMoment = isCriticalSuccess ? 'impossible_success' : 'devastating_failure';
        }
    } else if (isD20) {
        if (roll.total >= 30) {
            tier = 'legendary';
            emotionalMoment = 'impossible_success';
        } else if (roll.total >= 25) {
            tier = 'impactful';
            if (isHighStakesContext) {
                emotionalMoment = 'clutch_save';
            }
        } else if (roll.total <= 5) {
            tier = 'impactful';
            if (isHighStakesContext) {
                emotionalMoment = 'devastating_failure';
            }
        }
    } else {
        // Non-d20 damage or spell rolls hitting maximums in high stakes scenarios
        const isMaxRoll = roll.rolls.some(r => {
            if (roll.diceType === 'd4' && r === 4) return true;
            if (roll.diceType === 'd6' && r === 6) return true;
            if (roll.diceType === 'd8' && r === 8) return true;
            if (roll.diceType === 'd10' && r === 10) return true;
            if (roll.diceType === 'd12' && r === 12) return true;
            if (roll.diceType === 'd100' && r >= 95) return true;
            return false;
        });

        if (isMaxRoll && isHighStakesContext) {
            tier = 'impactful';
            emotionalMoment = 'clutch_save';
        }
    }

    // Explicit check for death saving throws
    if (ctx.includes('death save')) {
        if (roll.result >= 10) {
            emotionalMoment = 'near_death_recovery';
            if (roll.result === 20) {
                tier = 'legendary';
            }
        } else {
            emotionalMoment = 'devastating_failure';
            if (roll.result === 1) {
                tier = 'legendary';
            }
        }
    }

    // Explicit check for character betrayals
    if (ctx.includes('betray') || ctx.includes('assassinate') || ctx.includes('poison ally')) {
        emotionalMoment = 'betrayal';
        if (isCriticalSuccess || roll.total >= 20) {
            tier = 'legendary';
        }
    }

    // Explicit check for boss slaying final blows
    if (ctx.includes('final blow') || ctx.includes('killing blow') || ctx.includes('slay')) {
        if (roll.total >= 15 || isCriticalSuccess) {
            emotionalMoment = 'final_blow';
            tier = 'legendary';
        }
    }

    return {
        tier,
        emotionalMoment,
        isLegendary: tier === 'legendary'
    };
};

export const storeDiceRoll = async (
    campaignId: number,
    userId: number,
    roll: DiceRollResult,
    context?: string,
    classification?: RollClassification,
    narration?: string
): Promise<DiceRollRow> => {
    const activeSessionId = await getActiveSessionId(campaignId);
    const { data, error } = await supabase
        .from('dice_rolls')
        .insert([
            {
                campaign_id: campaignId,
                session_id: activeSessionId ?? null,
                room_id: String(campaignId),
                user_id: userId,
                dice_type: roll.diceType,
                rolls: roll.rolls,
                result: roll.result,
                modifier: roll.modifier,
                total: roll.total,
                advantage_state: roll.advantageState,
                context: context ?? null,
                classification: classification ?? null,
                narration: narration ?? null
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to store dice roll');
    }
    return data as DiceRollRow;
};
