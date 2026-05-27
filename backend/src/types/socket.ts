export const SocketEvents = {
    Error: 'ERROR',
    JoinCampaign: 'JOIN_CAMPAIGN',
    LeaveCampaign: 'LEAVE_CAMPAIGN',
    RequestAiNarration: 'REQUEST_AI_NARRATION',
    RequestAiWorldEvent: 'REQUEST_AI_WORLD_EVENT',
    PlayerJoined: 'PLAYER_JOINED',
    PlayerLeft: 'PLAYER_LEFT',
    PlayerTyping: 'PLAYER_TYPING',
    DiceRolled: 'DICE_ROLLED',
    TokenMoved: 'TOKEN_MOVED',
    MapRevealed: 'MAP_REVEALED',
    NewNarration: 'NEW_NARRATION',
    WorldEvent: 'WORLD_EVENT',
    QuestUpdated: 'QUEST_UPDATED',
    SessionStarted: 'SESSION_STARTED',
    SessionEnded: 'SESSION_ENDED',
    CampaignState: 'CAMPAIGN_STATE',
    MapPing: 'MAP_PING',
    TokenCreated: 'TOKEN_CREATED',
    TokenUpdated: 'TOKEN_UPDATED',
    TokenDeleted: 'TOKEN_DELETED',
    MapViewport: 'MAP_VIEWPORT',
    CombatTurn: 'COMBAT_TURN',
    NewMemoryMoment: 'NEW_MEMORY_MOMENT'
} as const;

export type SocketEventName = typeof SocketEvents[keyof typeof SocketEvents];
