import { supabase } from '../config/db';
import { callOpenAi } from '../ai/aiService';
import { getCampaignById } from './campaignService';

export interface TavernNpc {
    id: string;
    name: string;
    role: string;
    faction: string;
    description: string;
    dialogue_history: { sender: 'player' | 'npc'; text: string }[];
    persistent_memories: string[];
    gossip_known: string;
}

export interface TavernRumor {
    id: string;
    text: string;
    credibility: 'High' | 'Moderate' | 'Unreliable';
    origin: string;
}

export interface TavernGossip {
    id: string;
    text: string;
    timestamp: string;
}

export interface FactionEncounter {
    id: string;
    faction: string;
    title: string;
    description: string;
    recruit_reward: string;
    status: 'pending' | 'accepted' | 'declined';
}

export interface ProceduralEvent {
    id: string;
    title: string;
    description: string;
}

export interface TavernState {
    name: string;
    description: string;
    ambience: 'cozy_hearth' | 'rowdy_brawl' | 'mysterious_shadows' | 'lively_festival';
    npcs: TavernNpc[];
    rumors: TavernRumor[];
    gossip_feed: TavernGossip[];
    faction_encounters: FactionEncounter[];
    procedural_events: ProceduralEvent[];
    world_state_evolution: string;
}

// Fallback thematic taverns for different settings to guarantee beautiful initial content
const FALLBACK_TAVERNS: Record<string, TavernState> = {
    fantasy: {
        name: "The Dragon's Flagon",
        description: "A sprawling timber tavern built around a massive ancient stone hearth. The warmth of woodsmoke, heavy roasted mutton, and dark spiced ale fills the crowded room as voices rise in song.",
        ambience: "cozy_hearth",
        npcs: [
            {
                id: "npc_grom",
                name: "Grombar the Stout",
                role: "Barkeep",
                faction: "Iron Shields Guild",
                description: "A battle-tested dwarf with a thick braided silver beard, wiping down a solid oak counter with a greasy cloth.",
                dialogue_history: [{ sender: "npc", text: "Welcome to the Flagon, traveler. If you are looking for fresh draft or dry gossip, you found the right tap." }],
                persistent_memories: ["Remembers the players arriving on a cold wet evening looking for shelter."],
                gossip_known: "The Iron Shields are offering gold to guards willing to protect the northern mine supply lines."
            },
            {
                id: "npc_lyra",
                name: "Lyra Valerius",
                role: "Patron / Bard",
                faction: "Independent",
                description: "A slender elf dressed in moss-green silk, tuning a brass lute while glancing warily at the door.",
                dialogue_history: [{ sender: "npc", text: "A song for a coin? Or perhaps a secret for a cup of sweet mead?" }],
                persistent_memories: ["Admires travelers with stories of the ruins."],
                gossip_known: "A glowing blue mist has been rising from the old elven barrows since the last full moon."
            },
            {
                id: "npc_ hooded",
                name: "The Hooded Recruiter",
                role: "Faction Scout",
                faction: "The Guild of Shadows",
                description: "A mysterious cloaked stranger sitting in the dim corner shadows, sharpening a small curved dagger.",
                dialogue_history: [{ sender: "npc", text: "Speak quietly, friend. Fences have ears, and my guild has opportunities." }],
                persistent_memories: ["Watches the player's movements with calculated interest."],
                gossip_known: "The high guards are taking bribes to look the other way at the South Gate tonight."
            }
        ],
        rumors: [
            { id: "rumor_1", text: "The Whispering Crypt has been unlocked, and some say the dead are walking the cemetery roads.", credibility: "High", origin: "A panicked gravedigger" },
            { id: "rumor_2", text: "Lord Vane is looking for the missing Sun Relic to reinforce his divine claim.", credibility: "Moderate", origin: "A gossiping merchant clerk" },
            { id: "rumor_3", text: "Orc warbands are gathering just past the jagged crags.", credibility: "Unreliable", origin: "A drunken hedge knight" }
        ],
        gossip_feed: [
            { id: "gossip_1", text: "Supply cart ambushed on the East Way; black arrows found in the debris.", timestamp: "1 hour ago" },
            { id: "gossip_2", text: "Magic guild recruits additional sentries for their library cellars.", timestamp: "3 hours ago" }
        ],
        faction_encounters: [
            {
                id: "enc_1",
                faction: "The Guild of Shadows",
                title: "Whispers in the Dark",
                description: "A folded parchment slid under your tankard reads: 'Retrieve the ledger from the tax master's desk. The Guild rewards its friends handsomely.'",
                recruit_reward: "200 Gold Pieces & Shadow Alliance Access",
                status: "pending"
            }
        ],
        procedural_events: [
            {
                id: "evt_1",
                title: "Brawl Erupts!",
                description: "A tall half-orc accuses a human merchant of cheating at dice, throwing a heavy wooden stool across the room."
            }
        ],
        world_state_evolution: "The wind outside howls as a fierce autumn storm begins. Patrons draw closer to the central fire."
    }
};

/**
 * Procedurally generates a tavern using OpenAI GPT, or returns a premium local fallback if keys are missing
 */
export async function generateProceduralTavern(campaignId: number): Promise<TavernState> {
    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
        throw new Error("Campaign not found");
    }

    const worldType = campaign.world_type || 'fantasy';
    const genre = campaign.current_session_state?.genre || 'High Fantasy';
    const tone = campaign.current_session_state?.tone || 'cinematic';
    const description = campaign.description || '';

    const prompt = `You are a TTRPG Dungeon Master. Procedurally generate a highly immersive fantasy tavern for the campaign "${campaign.name}" which is a "${genre}" world with a "${tone}" tone.
The campaign description is: "${description}".

Your output must be a valid JSON object matching the following TypeScript interface strictly:
interface TavernState {
    name: string;
    description: string;
    ambience: 'cozy_hearth' | 'rowdy_brawl' | 'mysterious_shadows' | 'lively_festival';
    npcs: Array<{
        id: string; // unique lowercase ID e.g. "npc_barkeep"
        name: string;
        role: string;
        faction: string;
        description: string;
        dialogue_history: Array<{ sender: 'npc'; text: string }>; // One initial introductory message
        persistent_memories: string[]; // 1-2 initial memories about the campaign context
        gossip_known: string; // One juicy rumor or local secret they know
    }>;
    rumors: Array<{
        id: string;
        text: string;
        credibility: 'High' | 'Moderate' | 'Unreliable';
        origin: string;
    }>; // exactly 3 rumors
    gossip_feed: Array<{
        id: string;
        text: string;
        timestamp: string;
    }>; // 2-3 recent world events/gossips
    faction_encounters: Array<{
        id: string;
        faction: string;
        title: string;
        description: string;
        recruit_reward: string;
        status: 'pending';
    }>; // 1 interesting faction recruitment opportunity
    procedural_events: Array<{
        id: string;
        title: string;
        description: string;
    }>; // 1 tavern-wide event currently happening
    world_state_evolution: string; // A description of how the time of day, weather, or current events affect the tavern mood
}

Return ONLY the raw JSON block without markdown formatting or code blocks. Ensure all strings are escaped correctly.`;

    try {
        const response = await callOpenAi(prompt);
        if (response) {
            // Strip markdown block markers if AI includes them
            const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const tavern = JSON.parse(cleaned) as TavernState;
            // Validate basic properties
            if (tavern.name && tavern.npcs && tavern.npcs.length > 0) {
                return tavern;
            }
        }
    } catch (err) {
        console.error("AI Tavern Generation failed, falling back to premium draft:", err);
    }

    // Return the premium thematic fallback
    const fallback = { ...FALLBACK_TAVERNS.fantasy };
    // Personalize name slightly based on campaign
    fallback.name = `The ${campaign.name.split(' ')[0] || 'Golden'} Dragon`;
    return fallback;
}

/**
 * Gets or procedurally generates the campaign tavern
 */
export async function getOrGenerateTavern(campaignId: number): Promise<TavernState> {
    const { data, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !data) {
        throw new Error("Campaign not found");
    }

    const state = data.current_session_state as any || {};
    if (state.tavern && state.tavern.name && state.tavern.npcs) {
        return state.tavern as TavernState;
    }

    // Generate new tavern
    const newTavern = await generateProceduralTavern(campaignId);
    state.tavern = newTavern;

    await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId);

    return newTavern;
}

/**
 * Chat with an NPC in the Tavern. Uses AI to reply in character and updates memory.
 */
export async function chatWithNpc(
    campaignId: number,
    npcId: string,
    playerMessage: string,
    userId: number
): Promise<{ reply: string; tavern: TavernState }> {
    const { data, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !data) {
        throw new Error("Campaign not found");
    }

    const state = data.current_session_state as any || {};
    const tavern = state.tavern as TavernState;
    if (!tavern || !tavern.npcs) {
        throw new Error("Tavern has not been generated yet");
    }

    const npcIndex = tavern.npcs.findIndex(n => n.id === npcId);
    if (npcIndex === -1) {
        throw new Error("NPC not found in tavern");
    }

    const npc = tavern.npcs[npcIndex];

    // Build the dialogue prompt
    const chatHistory = npc.dialogue_history.slice(-6).map(h => `${h.sender.toUpperCase()}: ${h.text}`).join('\n');
    const memoriesStr = npc.persistent_memories.join('\n');

    const prompt = `You are playing the role of ${npc.name}, a ${npc.role} aligned with the faction "${npc.faction || 'none'}".
Your description: "${npc.description}".
You know this secret gossip: "${npc.gossip_known}".
Your memories: "${memoriesStr}".

Tavern description: "${tavern.name} - ${tavern.description}".

Recent dialogue history:
${chatHistory}

The Player says to you: "${playerMessage}"

Provide your in-character verbal response (1-2 sentences). Keep the tone fantasy-themed and matching your description.
Additionally, if you learned something new or important from the player's message, provide a single short sentence starting with "MEMORY: " describing what you will remember. If nothing new was learned, omit the "MEMORY:" line.

Format your response as:
[DIALOGUE]
your response here...

[MEMORIES]
MEMORY: (optional) description of new memory to store`;

    try {
        const response = await callOpenAi(prompt);
        let npcReply = `*${npc.name} nods politely but remains thoughtful.*`;
        let newMemory: string | null = null;

        if (response) {
            const dialogueMatch = response.match(/\[DIALOGUE\]\s*([\s\S]*?)(?:\[MEMORIES\]|$)/i);
            const memoriesMatch = response.match(/\[MEMORIES\]\s*([\s\S]*?)$/i);

            if (dialogueMatch) {
                npcReply = dialogueMatch[1].trim();
            } else {
                npcReply = response.replace(/\[DIALOGUE\]/gi, '').replace(/\[MEMORIES\]/gi, '').trim();
            }

            if (memoriesMatch) {
                const memText = memoriesMatch[1].trim();
                if (memText.startsWith("MEMORY:")) {
                    newMemory = memText.replace("MEMORY:", "").trim();
                }
            }
        }

        // Update npc history
        npc.dialogue_history.push({ sender: 'player', text: playerMessage });
        npc.dialogue_history.push({ sender: 'npc', text: npcReply });
        
        // Cap history to keep JSON size clean
        if (npc.dialogue_history.length > 20) {
            npc.dialogue_history = npc.dialogue_history.slice(-12);
        }

        if (newMemory) {
            npc.persistent_memories.push(newMemory);
            if (npc.persistent_memories.length > 5) {
                npc.persistent_memories.shift();
            }
        }

        tavern.npcs[npcIndex] = npc;
        state.tavern = tavern;

        await supabase
            .from('campaigns')
            .update({ current_session_state: state })
            .eq('id', campaignId);

        return { reply: npcReply, tavern };
    } catch (err) {
        console.error("AI Tavern NPC dialogue failed:", err);
        const fallbackReply = `Aye, interesting times we live in. Let me fetch you another mug.`;
        npc.dialogue_history.push({ sender: 'player', text: playerMessage });
        npc.dialogue_history.push({ sender: 'npc', text: fallbackReply });
        tavern.npcs[npcIndex] = npc;
        state.tavern = tavern;

        await supabase
            .from('campaigns')
            .update({ current_session_state: state })
            .eq('id', campaignId);

        return { reply: fallbackReply, tavern };
    }
}

/**
 * Accept or decline a faction recruitment encounter
 */
export async function respondToFactionRecruitment(
    campaignId: number,
    encounterId: string,
    action: 'accept' | 'decline'
): Promise<TavernState> {
    const { data, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !data) {
        throw new Error("Campaign not found");
    }

    const state = data.current_session_state as any || {};
    const tavern = state.tavern as TavernState;
    if (!tavern || !tavern.faction_encounters) {
        throw new Error("Tavern state corrupted");
    }

    const encIndex = tavern.faction_encounters.findIndex(e => e.id === encounterId);
    if (encIndex === -1) {
        throw new Error("Faction encounter not found");
    }

    tavern.faction_encounters[encIndex].status = action === 'accept' ? 'accepted' : 'declined';
    
    // Add dynamic gossip based on player choice!
    const encounter = tavern.faction_encounters[encIndex];
    if (action === 'accept') {
        tavern.gossip_feed.unshift({
            id: `gossip_acc_${Date.now()}`,
            text: `Rumors say the party has aligned with ${encounter.faction} for a crucial mission.`,
            timestamp: "Just now"
        });
        
        // Evolve world state slightly
        tavern.world_state_evolution = `Tension shifts. The patrons associated with rival factions cast suspicious side-glances at your table.`;
    } else {
        tavern.gossip_feed.unshift({
            id: `gossip_dec_${Date.now()}`,
            text: `The party was seen turning down a secret contract from the ${encounter.faction}.`,
            timestamp: "Just now"
        });
    }

    if (tavern.gossip_feed.length > 5) {
        tavern.gossip_feed = tavern.gossip_feed.slice(0, 5);
    }

    state.tavern = tavern;

    await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId);

    return tavern;
}

/**
 * Triggers a procedural event inside the tavern (bard concert, brawl, shadow deal)
 */
export async function triggerTavernEvent(campaignId: number): Promise<{ event: ProceduralEvent; tavern: TavernState }> {
    const { data, error } = await supabase
        .from('campaigns')
        .select('current_session_state')
        .eq('id', campaignId)
        .single();

    if (error || !data) {
        throw new Error("Campaign not found");
    }

    const state = data.current_session_state as any || {};
    const tavern = state.tavern as TavernState;
    if (!tavern) {
        throw new Error("Tavern not initialized");
    }

    const prompt = `Procedurally generate an exciting in-tavern event for a tavern named "${tavern.name}".
The current mood of the tavern is: "${tavern.world_state_evolution}".
The description is: "${tavern.description}".

Your output must be a valid JSON object matching the following TypeScript interface strictly:
interface ProceduralEvent {
    title: string;
    description: string;
}

Make the event dramatic, engaging, and in line with fantasy tavern tropes (e.g. card cheating dispute, mysterious package drop, bard singing about the party's recent feats, a wizard's familiar causing chaos).`;

    let newEvent: ProceduralEvent = {
        id: `evt_${Date.now()}`,
        title: "A Sudden Toast!",
        description: "The local guards raise their wooden tankards in a booming chorus, toast to their commander, and buy a round of ale for everyone nearby."
    };

    try {
        const response = await callOpenAi(prompt);
        if (response) {
            const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            if (parsed.title && parsed.description) {
                newEvent = {
                    id: `evt_${Date.now()}`,
                    title: parsed.title,
                    description: parsed.description
                };
            }
        }
    } catch (err) {
        console.error("Failed to generate tavern event:", err);
    }

    // Append to tavern procedural events log
    tavern.procedural_events.unshift(newEvent);
    if (tavern.procedural_events.length > 3) {
        tavern.procedural_events = tavern.procedural_events.slice(0, 3);
    }

    // Update tavern's evolving world state
    tavern.world_state_evolution = `Following the event: "${newEvent.title}", the tavern is now abuzz with conversation.`;

    state.tavern = tavern;

    await supabase
        .from('campaigns')
        .update({ current_session_state: state })
        .eq('id', campaignId);

    return { event: newEvent, tavern };
}
