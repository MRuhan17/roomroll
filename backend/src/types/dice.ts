export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export type AdvantageState = 'normal' | 'advantage' | 'disadvantage';

export interface DiceRollRequest {
    diceType: DiceType;
    modifier?: number;
    advantageState?: AdvantageState;
    context?: string;
}

export interface DiceRollResult {
    diceType: DiceType;
    rolls: number[];
    result: number;
    modifier: number;
    total: number;
    advantageState: AdvantageState;
    isCriticalSuccess: boolean;
    isCriticalFail: boolean;
}

export interface DiceRollRow {
    id: number;
    campaign_id: number;
    user_id: number;
    dice_type: DiceType;
    rolls: number[];
    result: number;
    modifier: number;
    total: number;
    advantage_state: AdvantageState;
    context: string | null;
    created_at: string;
}
