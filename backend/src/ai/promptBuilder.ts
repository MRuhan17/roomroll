import { CampaignSnapshot } from '../services/campaignStateService';

export const buildNarrationPrompt = (snapshot: CampaignSnapshot, playerAction: string, tone?: string): string => {
    const campaignName = snapshot.campaign?.name ?? 'the campaign';
    const worldType = snapshot.campaign?.world_type ?? 'fantasy';
    const description = snapshot.campaign?.description ?? '';
    const state = snapshot.campaign?.current_session_state as any ?? {};
    const genre = state.genre ?? '';
    const campaignTone = state.tone ?? tone ?? 'cinematic';
    const footnotes = state.story_footnotes ?? '';
    const guidance = state.guidance ?? {};

    const guidanceParts = [];
    if (guidance.important_locations) guidanceParts.push(`Locations: ${guidance.important_locations}`);
    if (guidance.forbidden_lore) guidanceParts.push(`Forbidden Lore: ${guidance.forbidden_lore}`);
    if (guidance.campaign_objectives) guidanceParts.push(`Objectives: ${guidance.campaign_objectives}`);
    if (guidance.recurring_villains) guidanceParts.push(`Recurring Villains: ${guidance.recurring_villains}`);
    if (guidance.faction_conflicts) guidanceParts.push(`Faction Conflicts: ${guidance.faction_conflicts}`);
    if (guidance.emotional_themes) guidanceParts.push(`Emotional Themes: ${guidance.emotional_themes}`);
    const guidanceStr = guidanceParts.join(' | ');

    const members = snapshot.members.map((member) => `User ${member.user_id} (${member.role})`).join(', ');
    const quests = snapshot.quests.map((quest) => `${quest.title} [${quest.status}]`).join('; ');
    const worldEvents = snapshot.worldEvents.map((event) => event.title).join('; ');
    const recentNarration = snapshot.recentEvents
        .filter((event) => event.event_type === 'NEW_NARRATION')
        .slice(0, 5)
        .map((event) => (event.content?.text as string) ?? '')
        .join(' ');
    const memories = snapshot.memories.map((memory) => memory.summary).join(' ');
    const lore = snapshot.lore?.map(l => `${l.title}: ${l.content}`).join(' | ');
    const factions = snapshot.factions?.map(f => `${f.name}: ${f.description}`).join(' | ');

    // Session-aware narrative pacing calculations
    const targetSessions = Number(state.target_sessions) || 5;
    const completedSessions = Number(state.completed_sessions) || 0;
    const pacingIntensity = state.pacing_intensity || 'balanced';
    const remainingSessions = Math.max(0, targetSessions - completedSessions);
    const ratio = targetSessions > 0 ? Math.min(1, completedSessions / targetSessions) : 0.5;

    let narrativePhase = 'Introduction';
    let pacingInstruction = 'Pace the story deliberately. Focus on setting the hooks, introducing the geography, laying out initial clues, and establishing the local stakes. Allow the players to explore without immediate existential pressure.';

    if (ratio >= 0.95) {
        narrativePhase = 'Finale & Resolution';
        pacingInstruction = 'This is the absolute finale! Guide all threads to a final reckoning or resolution. Escalate drama to its peak, prioritize resolving all unfinished important arcs, and prepare the definitive cinematic conclusion or consequences of their journey.';
    } else if (ratio >= 0.8) {
        narrativePhase = 'Climax Buildup';
        pacingInstruction = 'The climax is imminent. Build strong tension, assemble the final confrontation details, and force players to make significant moral choices or sacrifices. Limit minor distractions or side quests.';
    } else if (ratio >= 0.6) {
        narrativePhase = 'Escalation';
        pacingInstruction = 'Escalate the conflicts! Faction hostilities boil over, enemies act aggressively, and simple solutions are blocked. Increase the threat level and pressure on the players.';
    } else if (ratio >= 0.45) {
        narrativePhase = 'Major Discovery / Twist';
        pacingInstruction = 'Reveal crucial hidden secrets or introduce an unexpected plot twist. Upend the players understanding of the stakes, expose high-profile betrayals, or reveal the master villains true face.';
    } else if (ratio >= 0.2) {
        narrativePhase = 'Rising Conflict';
        pacingInstruction = 'Escalate initial tensions, introduce rival factions, reveal secondary objectives, and prompt deeper investment in the main plot line.';
    }

    if (pacingIntensity === 'fast') {
        pacingInstruction += ' Compress pacing to move rapidly through encounters, resolve sub-plots quickly, and keep action extremely high.';
    } else if (pacingIntensity === 'slow') {
        pacingInstruction += ' Slow down the pacing, allow for extended character-driven interactions, and describe sensory details in depth.';
    }

    const criticalArcs = state.critical_arcs as string[] ?? [];
    const activeArcs = criticalArcs.filter(a => !a.startsWith('[x]')).join('; ');
    const resolvedArcs = criticalArcs.filter(a => a.startsWith('[x]')).map(a => a.replace('[x]', '').trim()).join('; ');

    const promptLines = [
      `You are the AI Dungeon Master for ${campaignName}, a ${genre || worldType} campaign.`,
      `Description/Rules: ${description}`,
      `Tone: ${campaignTone}.`,
      `Campaign Pacing Phase: ${narrativePhase} (Session ${completedSessions + 1} of ${targetSessions}) | Pacing Guideline: ${pacingInstruction}`,
      footnotes ? `Story Footnotes & Prepared Secrets (Adhere strictly and expand naturally): ${footnotes}` : '',
      guidanceStr ? `DM Objectives & Directives: ${guidanceStr}` : '',
      activeArcs ? `Active Plot Arcs/Subplots (Drive focus towards resolving these): ${activeArcs}` : '',
      resolvedArcs ? `Resolved Plot Arcs/Milestones (Do not reintroduce, treat as resolved history): ${resolvedArcs}` : '',
      `Players: ${members || 'unknown'}.`,
      `Active quests: ${quests || 'none'}.`,
      `World events: ${worldEvents || 'none'}.`,
      `Memory: ${memories || 'none'}.`,
      `Lore: ${lore || 'none'}.`,
      `Factions: ${factions || 'none'}.`,
      `Recent narration: ${recentNarration || 'none'}.`,
      `Player action: ${playerAction}`,
      `Respond with cinematic narration in 2-4 sentences, include immediate consequences or reactions.`
    ];

    return promptLines.filter(line => line !== '').join('\n');
};

const buildBaseContext = (snapshot: CampaignSnapshot): string => {
    const campaignName = snapshot.campaign?.name ?? 'the campaign';
    const worldType = snapshot.campaign?.world_type ?? 'fantasy';
    const description = snapshot.campaign?.description ?? '';
    const state = snapshot.campaign?.current_session_state as any ?? {};
    const genre = state.genre ?? '';
    const footnotes = state.story_footnotes ?? '';
    const guidance = state.guidance ?? {};

    const guidanceParts = [];
    if (guidance.important_locations) guidanceParts.push(`Locations: ${guidance.important_locations}`);
    if (guidance.forbidden_lore) guidanceParts.push(`Forbidden Lore: ${guidance.forbidden_lore}`);
    if (guidance.campaign_objectives) guidanceParts.push(`Objectives: ${guidance.campaign_objectives}`);
    if (guidance.recurring_villains) guidanceParts.push(`Recurring Villains: ${guidance.recurring_villains}`);
    if (guidance.faction_conflicts) guidanceParts.push(`Faction Conflicts: ${guidance.faction_conflicts}`);
    if (guidance.emotional_themes) guidanceParts.push(`Emotional Themes: ${guidance.emotional_themes}`);
    const guidanceStr = guidanceParts.join(' | ');

    const memories = snapshot.memories.map((m) => m.summary).join('; ');
    const npcs = snapshot.tokens.filter(t => t.token_type === 'npc' || t.token_type === 'boss').map(t => t.label).join(', ');
    const lore = snapshot.lore?.map(l => `${l.title}: ${l.content}`).join(' | ');
    const factions = snapshot.factions?.map(f => `${f.name}: ${f.description}`).join(' | ');
    
    // Session calculations
    const targetSessions = Number(state.target_sessions) || 5;
    const completedSessions = Number(state.completed_sessions) || 0;
    const pacingIntensity = state.pacing_intensity || 'balanced';
    const ratio = targetSessions > 0 ? Math.min(1, completedSessions / targetSessions) : 0.5;
    
    let narrativePhase = 'Introduction';
    if (ratio >= 0.95) narrativePhase = 'Finale & Resolution';
    else if (ratio >= 0.8) narrativePhase = 'Climax Buildup';
    else if (ratio >= 0.6) narrativePhase = 'Escalation';
    else if (ratio >= 0.45) narrativePhase = 'Major Discovery / Twist';
    else if (ratio >= 0.2) narrativePhase = 'Rising Conflict';

    const contextLines = [
        `Campaign: ${campaignName} (${genre || worldType})`,
        `Description/Rules: ${description}`,
        `Current Narrative Phase: ${narrativePhase} (Session ${completedSessions + 1} of ${targetSessions}) | Pacing Intensity: ${pacingIntensity}`,
        footnotes ? `Story Footnotes: ${footnotes}` : '',
        guidanceStr ? `DM Objectives: ${guidanceStr}` : '',
        `Core Memories: ${memories || 'none'}`,
        `Present NPCs/Entities: ${npcs || 'none'}`,
        `Lore: ${lore || 'none'}`,
        `Factions: ${factions || 'none'}`
    ];

    return contextLines.filter(line => line !== '').join('\n');
};

export const buildNpcDialoguePrompt = (snapshot: CampaignSnapshot, npcName: string, playerInput: string): string => {
    return [
        `You are roleplaying as the NPC "${npcName}".`,
        buildBaseContext(snapshot),
        `Player says/does: "${playerInput}"`,
        `Respond in character as ${npcName}. Keep it concise (1-3 sentences). Do not include actions, only dialogue.`
    ].join('\n\n');
};

export const buildEnvironmentPrompt = (snapshot: CampaignSnapshot, locationName: string): string => {
    return [
        `You are the DM. Provide a rich, sensory environmental description of the location: "${locationName}".`,
        buildBaseContext(snapshot),
        `Focus on atmosphere, lighting, and immediate impressions. Keep it under 4 sentences.`
    ].join('\n\n');
};

export const buildQuestHookPrompt = (snapshot: CampaignSnapshot): string => {
    const activeQuests = snapshot.quests.map((q) => q.title).join(', ');
    return [
        `You are the DM. Generate a compelling new quest hook or rumor.`,
        buildBaseContext(snapshot),
        `Current active quests: ${activeQuests || 'none'}`,
        `The hook should be directly tied to the campaign's lore or present NPCs. Return exactly in JSON format: { "title": "Quest Title", "description": "1-2 sentence hook" }`
    ].join('\n\n');
};

export const buildFactionReactionPrompt = (snapshot: CampaignSnapshot, factionName: string, triggeringEvent: string): string => {
    return [
        `Describe how the faction "${factionName}" reacts to the following event: "${triggeringEvent}".`,
        buildBaseContext(snapshot),
        `Detail their immediate internal reaction and any outward actions they might take. Keep it to 2-3 sentences.`
    ].join('\n\n');
};

export const buildSessionSummaryPrompt = (snapshot: CampaignSnapshot): string => {
    const recentNarration = snapshot.recentEvents
        .filter((event) => event.event_type === 'NEW_NARRATION')
        .slice(0, 15)
        .map((event) => (event.content?.text as string) ?? '')
        .join(' ');
        
    return [
        `You are the DM summarizing the latest game session.`,
        buildBaseContext(snapshot),
        `Raw session events:\n${recentNarration}`,
        `Write a dramatic, cohesive 1-paragraph summary of what happened this session.`
    ].join('\n\n');
};

export const buildCinematicRecapPrompt = (campaignName: string, eventsSummary: string, tone: string): string => {
    return `You are a master fantasy RPG bard and co-Dungeon Master.
We are compiling an epic cinematic session recap for the campaign "${campaignName}".
The selected tone for this recap is: "${tone}" (e.g. dramatic, mysterious, heroic, tragic, horror). You must strictly adhere to this tone in your writing.

Below is the chronological timeline of raw events, rolls, and narration that transpired during this session:
---
${eventsSummary}
---

Your task is to analyze this session timeline and generate a high-fidelity cinematic session recap JSON.
Your recap must highlight:
1. Major decisions made by players.
2. Discoveries (secrets found, ancient lore, hidden treasures, magic items, new locations).
3. Betrayals, conflicts, deaths, or major faction consequences.
4. Legendary dice rolls (critical successes/failures, clutch rolls).
5. Emotional moments (tension, heartbreak, triumph, terror).

You must output EXACTLY a JSON object matching this structure:
{
  "title": "A short, evocative, cinematic title for this chapter/session",
  "summary": "A beautifully written, immersive 3-paragraph narrative storytelling recap. Use rich vocabulary, sensory details, and capture the raw stakes.",
  "tone": "${tone}",
  "highlights": [
    {
      "type": "decision" | "betrayal" | "discovery" | "death" | "legendary_roll" | "emotional_moment" | "faction_consequence",
      "description": "A gripping description of the highlight.",
      "intensity": "low" | "medium" | "high" | "critical"
    }
  ],
  "narration": "A dramatic, audio-ready voiceover transcript (e.g., 'The wind howls through the crypt as the die is cast...'). Include parenthetical performance notes for the voice actor, like: (whispered with dread) or (with booming epic volume)."
}

Respond ONLY with the JSON object. Do not include extra conversational text or markdown wrappers other than the JSON block.`;
};

