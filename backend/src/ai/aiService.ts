import { 
    buildNarrationPrompt, 
    buildNpcDialoguePrompt, 
    buildEnvironmentPrompt, 
    buildQuestHookPrompt, 
    buildFactionReactionPrompt, 
    buildSessionSummaryPrompt 
} from './promptBuilder';
import { getCampaignSnapshot } from '../services/campaignStateService';
import { createCampaignEvent } from '../services/eventService';
import { appendNarrationLog, createCampaignMemory } from '../services/memoryService';
import { NarrationRequest, NarrationResponse } from '../types/ai';

const aiCooldowns = new Map<number, number>();
const COOLDOWN_MS = 15000; // 15 seconds

const checkCooldown = (userId: number): boolean => {
    const now = Date.now();
    const lastRequest = aiCooldowns.get(userId) || 0;
    if (now - lastRequest < COOLDOWN_MS) {
        return false;
    }
    aiCooldowns.set(userId, now);
    return true;
};

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
        console.warn('[ai]: fetch is unavailable; falling back to template narration');
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
    if (!checkCooldown(request.userId)) {
        throw new Error('AI is on cooldown. Please wait before requesting again.');
    }
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

export const generateAiWorldEvent = async (campaignId: number, userId: number): Promise<{ title: string; description: string }> => {
    if (!checkCooldown(userId)) {
        throw new Error('AI is on cooldown.');
    }
    const snapshot = await getCampaignSnapshot(campaignId);
    const prompt = `Based on the active campaign "${snapshot.campaign?.name}", generate a sudden, dramatic world event. Return exactly in JSON format: { "title": "Event Name", "description": "1-2 sentences of the event" }.`;
    
    const response = await callOpenAi(prompt);
    if (!response) {
        return { title: 'The World Trembles', description: 'A sudden tremor shakes the land.' };
    }
    
    try {
        const parsed = JSON.parse(response.replace(/```json|```/g, '').trim());
        return { title: parsed.title || 'Unknown Event', description: parsed.description || 'Something shifted.' };
    } catch {
        return { title: 'Chaos Erupts', description: response.substring(0, 100) };
    }
};

export const updateNpcRelationship = async (campaignId: number, npcName: string, interactionContext: string): Promise<void> => {
    // Generate a summarized memory for the NPC relationship based on the player interaction
    const prompt = `Summarize this interaction with NPC ${npcName} into a core relationship memory fact: ${interactionContext}`;
    const summary = await callOpenAi(prompt) ?? `Interacted with ${npcName}`;
    
    await createCampaignMemory(campaignId, `Relationship updated with ${npcName}`, [
        { type: 'npc_relationship', npc: npcName, memory: summary }
    ]);
};

export const generateNpcDialogue = async (campaignId: number, userId: number, npcName: string, playerInput: string): Promise<string> => {
    if (!checkCooldown(userId)) throw new Error('AI is on cooldown.');
    const snapshot = await getCampaignSnapshot(campaignId);
    const prompt = buildNpcDialoguePrompt(snapshot, npcName, playerInput);
    return await callOpenAi(prompt) ?? `*${npcName} remains silent.*`;
};

export const generateEnvironmentDescription = async (campaignId: number, userId: number, locationName: string): Promise<string> => {
    if (!checkCooldown(userId)) throw new Error('AI is on cooldown.');
    const snapshot = await getCampaignSnapshot(campaignId);
    const prompt = buildEnvironmentPrompt(snapshot, locationName);
    return await callOpenAi(prompt) ?? `You see ${locationName}.`;
};

export const generateQuestHook = async (campaignId: number, userId: number): Promise<{ title: string; description: string }> => {
    if (!checkCooldown(userId)) throw new Error('AI is on cooldown.');
    const snapshot = await getCampaignSnapshot(campaignId);
    const prompt = buildQuestHookPrompt(snapshot);
    const response = await callOpenAi(prompt);
    try {
        const parsed = JSON.parse(response?.replace(/```json|```/g, '').trim() ?? '{}');
        return { title: parsed.title || 'A New Path', description: parsed.description || 'A mysterious opportunity arises.' };
    } catch {
        return { title: 'A New Path', description: response ?? 'A mysterious opportunity arises.' };
    }
};

export const generateFactionReaction = async (campaignId: number, userId: number, factionName: string, event: string): Promise<string> => {
    if (!checkCooldown(userId)) throw new Error('AI is on cooldown.');
    const snapshot = await getCampaignSnapshot(campaignId);
    const prompt = buildFactionReactionPrompt(snapshot, factionName, event);
    return await callOpenAi(prompt) ?? `The ${factionName} takes note of the event.`;
};

export const generateSessionSummary = async (campaignId: number, userId: number): Promise<string> => {
    if (!checkCooldown(userId)) throw new Error('AI is on cooldown.');
    const snapshot = await getCampaignSnapshot(campaignId);
    const prompt = buildSessionSummaryPrompt(snapshot);
    return await callOpenAi(prompt) ?? `The party continued their adventure.`;
};
