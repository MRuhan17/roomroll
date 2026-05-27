export interface NarrationRequest {
    campaignId: number;
    userId: number;
    playerAction: string;
    tone?: 'cinematic' | 'mysterious' | 'intense' | 'light';
}

export interface NarrationResponse {
    narration: string;
    usedFallback: boolean;
    promptSummary: string;
    detectedMoment?: any;
}
