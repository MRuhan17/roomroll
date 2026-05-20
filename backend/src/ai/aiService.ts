import { 
    buildNarrationPrompt, 
    buildNpcDialoguePrompt, 
    buildEnvironmentPrompt, 
    buildQuestHookPrompt, 
    buildFactionReactionPrompt, 
    buildSessionSummaryPrompt,
    buildCinematicRecapPrompt
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

export const callOpenAi = async (prompt: string): Promise<string | null> => {
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

export const generateFutureStoryPreparation = async (campaignId: number, userId: number): Promise<any[]> => {
    const snapshot = await getCampaignSnapshot(campaignId);
    const campaignName = snapshot.campaign?.name || 'Untitled Campaign';
    const campaignDesc = snapshot.campaign?.description || '';
    const worldType = snapshot.campaign?.world_type || 'Fantasy';

    const prompt = `You are the ultimate tabletop RPG AI co-Dungeon Master.
We are preparing future narrative paths for the campaign "${campaignName}" (World Setting: ${worldType}, Description: ${campaignDesc}).
Based on this world, generate exactly 10 distinct future story points and narrative branches ahead of the current session.

Each story point MUST include all of the following details:
1. "title": A short, cinematic title.
2. "description": A paragraph describing the scene or plot hook.
3. "branch_type": One of: 'main', 'side_quest', 'twist', 'faction_clash', 'lore_discovery'.
4. "pacing_recommendation": How the DM should build tension or speed up the scene.
5. "emotional_moment": How to make players feel the weight, consequence, danger, or mystery.
6. "combat_opportunity": Possible encounters or enemies they might face.
7. "player_decision_prediction": What options players are likely to consider and how they branch.
8. "backup_scenario": A contingency plan in case players completely derail the main path or kill/ignore NPCs.
9. "possible_encounters": Specific encounters they might face.
10. "faction_reactions": How factions will react to this point.
11. "character_consequences": The consequences for individual party members.
12. "plot_twists": A shocking twist.
13. "npc_betrayals": Potential betrayals or hidden motivations of friendly/neutral NPCs.
14. "lore_discoveries": Ancient secrets or clues they can discover.

Return EXACTLY a JSON array of 10 items. Do not wrap in extra explanation, conversational text, or any formatting other than the JSON block.
Ensure the keys match exactly:
[
  {
    "id": 1,
    "title": "...",
    "description": "...",
    "branch_type": "...",
    "pacing_recommendation": "...",
    "emotional_moment": "...",
    "combat_opportunity": "...",
    "player_decision_prediction": "...",
    "backup_scenario": "...",
    "possible_encounters": "...",
    "faction_reactions": "...",
    "character_consequences": "...",
    "plot_twists": "...",
    "npc_betrayals": "...",
    "lore_discoveries": "...",
    "is_locked": false,
    "is_rejected": false
  },
  ...
]`;

    const response = await callOpenAi(prompt);
    if (!response) {
        throw new Error('Failed to generate story points from AI.');
    }

    try {
        const cleaned = response.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        throw new Error('AI did not return a valid array of story points.');
    } catch (err) {
        console.error('Failed to parse AI story points:', err, response);
        // Fallback generator of 10 default points in case of JSON parse failure
        const fallbacks = [];
        for (let i = 1; i <= 10; i++) {
            fallbacks.push({
                id: i,
                title: `Chapter ${i}: The Emerging Shadow`,
                description: `A mysterious force begins to manifest in the region of the world, presenting unexpected threats to the party.`,
                branch_type: 'main',
                pacing_recommendation: `Start slow with environmental descriptions, then raise tension dynamically.`,
                emotional_moment: `Make the party feel the vast, ancient weight of the world's secrets.`,
                combat_opportunity: `An ambush by mysterious creatures under the cover of night.`,
                player_decision_prediction: `Players will either investigate the rumors or seek protection.`,
                backup_scenario: `If players ignore the threat, the shadow advances, overtaking a nearby town.`,
                possible_encounters: `3 Shadow Whelps, 1 Dark Acolyte`,
                faction_reactions: `The local militia panics; the wizard's guild remains secretive.`,
                character_consequences: `One party member discovers a strange sigil matching their backstory.`,
                plot_twists: `The local patron who hired them is secretly aligned with the shadows.`,
                npc_betrayals: `A tavern keeper sells information about their plans.`,
                lore_discoveries: `An ancient stone tablet describing the sealing of a dark lord.`,
                is_locked: false,
                is_rejected: false
            });
        }
        return fallbacks;
    }
};

export const generateCinematicRecap = async (
    campaignId: number,
    sessionId: string,
    tone: string = 'dramatic',
    userId: number
): Promise<any> => {
    if (!checkCooldown(userId)) {
        throw new Error('AI is on cooldown.');
    }

    const { supabase } = await import('../config/db');

    // 1. Fetch the campaign info
    const { data: campaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();
    const campaignName = campaign?.name || 'the campaign';

    // 2. Fetch the session events
    const { data: events, error: eventsError } = await supabase
        .from('campaign_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (eventsError) {
        throw new Error('Failed to retrieve session events for recap.');
    }

    // 3. Format timeline
    let timelineStr = '';
    if (!events || events.length === 0) {
        timelineStr = 'No events were logged during this session.';
    } else {
        timelineStr = events.map((evt: any) => {
            const time = new Date(evt.created_at).toLocaleTimeString();
            if (evt.event_type === 'NEW_NARRATION') {
                return `[${time}] Narration: ${evt.content?.text}`;
            } else if (evt.event_type === 'DICE_ROLLED') {
                const r = evt.content?.roll;
                return `[${time}] Dice Roll: User rolled a ${r?.total ?? r?.result} on a ${r?.dice_type ?? 'die'} (Context: ${r?.context || 'none'}, Advantage: ${r?.advantage_state || 'normal'}).`;
            } else if (evt.event_type === 'WORLD_EVENT') {
                return `[${time}] World Event triggered: "${evt.content?.event?.title}" - ${evt.content?.event?.description}`;
            } else if (evt.event_type === 'QUEST_UPDATED') {
                return `[${time}] Quest "${evt.content?.quest?.title}" status updated to ${evt.content?.quest?.status}.`;
            } else {
                return `[${time}] Event ${evt.event_type}`;
            }
        }).join('\n');
    }

    // 4. Build prompt & call OpenAI
    const prompt = buildCinematicRecapPrompt(campaignName, timelineStr, tone);
    const aiResponse = await callOpenAi(prompt);

    let recapJson: any = null;
    if (aiResponse) {
        try {
            const cleaned = aiResponse.replace(/```json|```/g, '').trim();
            recapJson = JSON.parse(cleaned);
        } catch (err) {
            console.error('Failed to parse AI session recap:', err, aiResponse);
        }
    }

    // Fallback if parsing fails or OpenAI fails
    if (!recapJson) {
        recapJson = {
            title: `Session Recap: The Cast of Fate`,
            summary: `The party set forth under the banner of adventure. Despite the shifting shadows and sudden clashes, they pressed onward, carving their name into the lore of the realm.`,
            tone,
            highlights: [
                {
                    type: 'emotional_moment',
                    description: 'The party gathered to end this chapter, bracing for the trials that lay ahead.',
                    intensity: 'medium'
                }
            ],
            narration: `(with a deep, resonant tone) Thus the chapter ends. The echoes of their deeds yet linger in the halls, and the road ahead remains dark...`
        };
    }

    // 5. Persist inside session_logs in Supabase!
    // Try to find if a session log already exists for this sessionId
    const { data: existingLog } = await supabase
        .from('session_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('session_id', sessionId)
        .maybeSingle();

    if (existingLog) {
        await supabase
            .from('session_logs')
            .update({ session_summary: JSON.stringify(recapJson) })
            .eq('id', existingLog.id);
    } else {
        await supabase
            .from('session_logs')
            .insert([{
                campaign_id: campaignId,
                session_id: sessionId,
                room_id: String(campaignId),
                session_summary: JSON.stringify(recapJson),
                narration_log: []
            }]);
    }

    return recapJson;
};

