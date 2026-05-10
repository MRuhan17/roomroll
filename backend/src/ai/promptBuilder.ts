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
