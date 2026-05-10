import { CampaignSnapshot } from '../services/campaignStateService';

export const buildNarrationPrompt = (snapshot: CampaignSnapshot, playerAction: string, tone?: string): string => {
    const campaignName = snapshot.campaign?.name ?? 'the campaign';
    const worldType = snapshot.campaign?.world_type ?? 'fantasy';
    const members = snapshot.members.map((member) => `User ${member.user_id} (${member.role})`).join(', ');
    const quests = snapshot.quests.map((quest) => `${quest.title} [${quest.status}]`).join('; ');
    const worldEvents = snapshot.worldEvents.map((event) => event.title).join('; ');
    const recentNarration = snapshot.recentEvents
        .filter((event) => event.event_type === 'NEW_NARRATION')
        .slice(0, 5)
        .map((event) => (event.content?.text as string) ?? '')
        .join(' ');
    const memories = snapshot.memories.map((memory) => memory.summary).join(' ');

    return [
        `You are the AI Dungeon Master for ${campaignName}, a ${worldType} campaign.`,
        `Tone: ${tone ?? 'cinematic'}.`,
        `Players: ${members || 'unknown'}.`,
        `Active quests: ${quests || 'none'}.`,
        `World events: ${worldEvents || 'none'}.`,
        `Memory: ${memories || 'none'}.`,
        `Recent narration: ${recentNarration || 'none'}.`,
        `Player action: ${playerAction}`,
        `Respond with cinematic narration in 2-4 sentences, include immediate consequences or reactions.`
    ].join('\n');
};

const buildBaseContext = (snapshot: CampaignSnapshot): string => {
    const campaignName = snapshot.campaign?.name ?? 'the campaign';
    const worldType = snapshot.campaign?.world_type ?? 'fantasy';
    const memories = snapshot.memories.map((m) => m.summary).join('; ');
    const npcs = snapshot.tokens.filter(t => t.token_type === 'npc' || t.token_type === 'boss').map(t => t.label).join(', ');
    
    return [
        `Campaign: ${campaignName} (${worldType})`,
        `Core Memories: ${memories || 'none'}`,
        `Present NPCs/Entities: ${npcs || 'none'}`
    ].join('\n');
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
