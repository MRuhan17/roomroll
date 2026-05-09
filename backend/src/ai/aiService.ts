import { buildNarrationPrompt } from './promptBuilder';
import { getCampaignSnapshot } from '../services/campaignStateService';
import { createCampaignEvent } from '../services/eventService';
import { appendNarrationLog } from '../services/memoryService';
import { NarrationRequest, NarrationResponse } from '../types/ai';

const buildFallbackNarration = (playerAction: string): string => {
    return `The world responds immediately—${playerAction}. The scene shifts with a cinematic beat as the consequences ripple outward.`;
};

const callOpenAi = async (prompt: string): Promise<string | null> => {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    if (!apiKey) {
        return null;
    }

    const runtimeFetch = globalThis.fetch;
    if (!runtimeFetch) {
        return null;
    }

    const response = await runtimeFetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: 'You are a cinematic tabletop RPG Dungeon Master.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.8
        })
    });

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? null;
};

export const generateNarration = async (request: NarrationRequest): Promise<NarrationResponse> => {
    const snapshot = await getCampaignSnapshot(request.campaignId);
    const prompt = buildNarrationPrompt(snapshot, request.playerAction, request.tone);

    const aiNarration = await callOpenAi(prompt);
    const narration = aiNarration ?? buildFallbackNarration(request.playerAction);
    const usedFallback = !aiNarration;

    await createCampaignEvent(
        request.campaignId,
        'NEW_NARRATION',
        { text: narration, playerAction: request.playerAction, tone: request.tone ?? 'cinematic' },
        request.userId
    );

    await appendNarrationLog(request.campaignId, {
        created_at: new Date().toISOString(),
        content: narration,
        created_by: request.userId
    });

    return {
        narration,
        usedFallback,
        promptSummary: prompt.slice(0, 400)
    };
};
