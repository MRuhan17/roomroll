import { supabase } from '../config/db';
import { AdvantageState, DiceRollRequest, DiceRollResult, DiceRollRow, DiceType } from '../types/dice';
import { rollDie } from '../utils/dice';
import { getActiveSessionId } from './sessionService';

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

export const storeDiceRoll = async (
    campaignId: number,
    userId: number,
    roll: DiceRollResult,
    context?: string
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
                context: context ?? null
            }
        ])
        .select('*')
        .single();
    if (error || !data) {
        throw error ?? new Error('Failed to store dice roll');
    }
    return data as DiceRollRow;
};
