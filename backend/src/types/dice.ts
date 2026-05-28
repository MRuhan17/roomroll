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
    classification?: {
        tier: 'standard' | 'impactful' | 'critical' | 'legendary';
        emotionalMoment?: 'clutch_save' | 'near_death_recovery' | 'betrayal' | 'final_blow' | 'impossible_success' | 'devastating_failure' | 'campaign_defining' | null;
        isLegendary: boolean;
    } | null;
    narration?: string | null;
    created_at: string;
}
