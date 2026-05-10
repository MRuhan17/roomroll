import { create } from "zustand";
import type { User } from "@/types/auth";
import type {
  AiPendingState,
  Campaign,
  CampaignMap,
  CampaignMapToken,
  CampaignMember,
  CampaignRole,
  CampaignSessionState,
  CampaignSnapshot,
  CampaignWorldEvent,
  DiceRollRow,
  LiveDiceRoll,
  NarrationEntry,
  NarrationSource,
  SessionParticipant,
} from "@/types/campaign";

interface RoomState {
  activeRoomId: number | null;
  isSocketConnected: boolean;
  campaign: Campaign | null;
  participants: SessionParticipant[];
  onlineUserIds: number[];
  sessionState: CampaignSessionState | null;
  activeMap: CampaignMap | null;
  mapTokens: CampaignMapToken[];
  revealState: Record<string, boolean>;
  narrationFeed: NarrationEntry[];
  worldEvents: CampaignWorldEvent[];
  diceHistory: DiceRollRow[];
  lastDiceRoll: LiveDiceRoll | null;
  typingUserIds: number[];
  aiPending: AiPendingState;
  lastError: string | null;
  activeTurnTokenId: number | null;
  setActiveRoomId: (id: number | null) => void;
  setSocketConnected: (connected: boolean) => void;
  applyCampaignSnapshot: (snapshot: CampaignSnapshot, currentUser: User | null, onlineUserIds?: number[]) => void;
  setOnlineUserIds: (onlineUserIds: number[], currentUser: User | null) => void;
  setTypingState: (userId: number, isTyping: boolean) => void;
  setAiPending: (kind: keyof AiPendingState, pending: boolean) => void;
  setLastError: (message: string | null) => void;
  prependNarration: (entry: NarrationEntry) => void;
  addWorldEvent: (event: CampaignWorldEvent) => void;
  addDiceRoll: (roll: DiceRollRow, currentUser: User | null) => void;
  upsertToken: (token: CampaignMapToken) => void;
  removeToken: (tokenId: number) => void;
  updateMap: (map: CampaignMap) => void;
  setSessionState: (state: CampaignSessionState | null) => void;
  setActiveTurnTokenId: (tokenId: number | null) => void;
  reset: () => void;
}

const initialAiPending = (): AiPendingState => ({
  narration: false,
  worldEvent: false,
});

const createInitialState = () => ({
  activeRoomId: null,
  isSocketConnected: false,
  campaign: null,
  participants: [] as SessionParticipant[],
  onlineUserIds: [] as number[],
  sessionState: null,
  activeMap: null,
  mapTokens: [] as CampaignMapToken[],
  revealState: {} as Record<string, boolean>,
  narrationFeed: [] as NarrationEntry[],
  worldEvents: [] as CampaignWorldEvent[],
  diceHistory: [] as DiceRollRow[],
  lastDiceRoll: null as LiveDiceRoll | null,
  typingUserIds: [] as number[],
  aiPending: initialAiPending(),
  lastError: null as string | null,
  activeTurnTokenId: null as number | null,
});

const roleOrder: Record<CampaignRole, number> = {
  DM: 0,
  player: 1,
};

function fallbackLabel(userId: number, role: CampaignRole, currentUser: User | null) {
  if (currentUser?.id === userId) {
    return currentUser.displayName;
  }

  return role === "DM" ? `Dungeon Master #${userId}` : `Adventurer #${userId}`;
}

function sortParticipants(participants: SessionParticipant[]) {
  return [...participants].sort((left, right) => {
    if (roleOrder[left.role] !== roleOrder[right.role]) {
      return roleOrder[left.role] - roleOrder[right.role];
    }
    if (left.isSelf !== right.isSelf) {
      return left.isSelf ? -1 : 1;
    }
    return left.label.localeCompare(right.label);
  });
}

function buildParticipants(
  members: CampaignMember[],
  onlineUserIds: number[],
  currentUser: User | null,
  existingParticipants: SessionParticipant[] = [],
) {
  const existingById = new Map(existingParticipants.map((participant) => [participant.userId, participant]));
  const memberIds = new Set<number>();

  const participants = members.map<SessionParticipant>((member) => {
    memberIds.add(member.user_id);
    const existing = existingById.get(member.user_id);
    const role = member.role === "DM" ? "DM" : "player";

    return {
      userId: member.user_id,
      label: existing?.label ?? fallbackLabel(member.user_id, role, currentUser),
      role,
      isOnline: onlineUserIds.includes(member.user_id),
      isSelf: currentUser?.id === member.user_id,
    };
  });

  for (const onlineUserId of onlineUserIds) {
    if (memberIds.has(onlineUserId)) {
      continue;
    }

    const existing = existingById.get(onlineUserId);
    const role = existing?.role ?? "player";

    participants.push({
      userId: onlineUserId,
      label: existing?.label ?? fallbackLabel(onlineUserId, role, currentUser),
      role,
      isOnline: true,
      isSelf: currentUser?.id === onlineUserId,
    });
  }

  return sortParticipants(participants);
}

function syncParticipantPresence(
  participants: SessionParticipant[],
  onlineUserIds: number[],
  currentUser: User | null,
) {
  const knownIds = new Set(participants.map((participant) => participant.userId));
  const nextParticipants = participants.map((participant) => ({
    ...participant,
    isOnline: onlineUserIds.includes(participant.userId),
    isSelf: currentUser?.id === participant.userId,
  }));

  for (const onlineUserId of onlineUserIds) {
    if (knownIds.has(onlineUserId)) {
      continue;
    }

    nextParticipants.push({
      userId: onlineUserId,
      label: fallbackLabel(onlineUserId, "player", currentUser),
      role: "player",
      isOnline: true,
      isSelf: currentUser?.id === onlineUserId,
    });
  }

  return sortParticipants(nextParticipants);
}

function normalizeRevealState(input: Record<string, unknown> | null | undefined) {
  if (!input) {
    return {};
  }

  const revealState: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "boolean") {
      revealState[key] = value;
    }
  }
  return revealState;
}

function resolveAuthorLabel(
  authorId: number | null,
  participants: SessionParticipant[],
  currentUser: User | null,
  fallbackSource: NarrationSource,
) {
  if (authorId === null) {
    return fallbackSource === "ai" ? "Roomroll AI" : "The Table";
  }

  const participant = participants.find((entry) => entry.userId === authorId);
  if (participant) {
    return participant.label;
  }

  return fallbackLabel(authorId, fallbackSource === "dm" ? "DM" : "player", currentUser);
}

function determineNarrationSource(
  authorId: number | null,
  participants: SessionParticipant[],
  hasAiMetadata: boolean,
): NarrationSource {
  if (hasAiMetadata) {
    return "ai";
  }

  if (authorId === null) {
    return "system";
  }

  const participant = participants.find((entry) => entry.userId === authorId);
  return participant?.role === "DM" ? "dm" : "player";
}

function buildNarrationEntries(
  events: CampaignSnapshot["recentEvents"],
  participants: SessionParticipant[],
  currentUser: User | null,
) {
  return events
    .filter((event) => event.event_type === "NEW_NARRATION")
    .map<NarrationEntry | null>((event) => {
      const text = event.content?.text;
      if (typeof text !== "string" || text.trim().length === 0) {
        return null;
      }

      const tone = typeof event.content?.tone === "string" ? event.content.tone : undefined;
      const playerAction =
        typeof event.content?.playerAction === "string" ? event.content.playerAction : undefined;
      const source = determineNarrationSource(event.created_by, participants, Boolean(tone || playerAction));

      return {
        id: `event:${event.id}`,
        text,
        source,
        authorId: event.created_by,
        authorLabel: resolveAuthorLabel(event.created_by, participants, currentUser, source),
        createdAt: event.created_at,
        tone,
        playerAction,
      };
    })
    .filter((entry): entry is NarrationEntry => Boolean(entry))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function buildLiveDiceRoll(
  roll: DiceRollRow,
  participants: SessionParticipant[],
  currentUser: User | null,
): LiveDiceRoll {
  const participant = participants.find((entry) => entry.userId === roll.user_id);
  const userLabel = participant?.label ?? fallbackLabel(roll.user_id, "player", currentUser);

  return {
    userId: roll.user_id,
    userLabel,
    diceType: roll.dice_type,
    result: roll.result,
    total: roll.total,
    createdAt: roll.created_at,
    context: roll.context,
    isCriticalSuccess: roll.dice_type === "d20" && roll.result === 20,
    isCriticalFail: roll.dice_type === "d20" && roll.result === 1,
  };
}

function sortWorldEvents(events: CampaignWorldEvent[]) {
  return [...events].sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
}

export const useRoomStore = create<RoomState>((set) => ({
  ...createInitialState(),

  setActiveRoomId: (id) => set({ activeRoomId: id }),

  setSocketConnected: (connected) => set({ isSocketConnected: connected }),

  applyCampaignSnapshot: (snapshot, currentUser, onlineUserIds) =>
    set((state) => {
      const nextOnlineUserIds = onlineUserIds ?? state.onlineUserIds;
      const participants = buildParticipants(
        snapshot.members,
        nextOnlineUserIds,
        currentUser,
        state.participants,
      );
      const narrationFeed = buildNarrationEntries(snapshot.recentEvents, participants, currentUser);
      const lastDiceRoll = snapshot.diceHistory[0]
        ? buildLiveDiceRoll(snapshot.diceHistory[0], participants, currentUser)
        : null;

      return {
        campaign: snapshot.campaign,
        participants,
        onlineUserIds: nextOnlineUserIds,
        sessionState: snapshot.campaign?.current_session_state ?? null,
        activeMap: snapshot.activeMap,
        mapTokens: snapshot.tokens,
        revealState: normalizeRevealState(snapshot.activeMap?.reveal_state),
        narrationFeed,
        worldEvents: sortWorldEvents(snapshot.worldEvents),
        diceHistory: snapshot.diceHistory,
        lastDiceRoll,
        typingUserIds: state.typingUserIds.filter((userId) => nextOnlineUserIds.includes(userId)),
        lastError: null,
      };
    }),

  setOnlineUserIds: (onlineUserIds, currentUser) =>
    set((state) => ({
      onlineUserIds,
      participants: syncParticipantPresence(state.participants, onlineUserIds, currentUser),
      typingUserIds: state.typingUserIds.filter((userId) => onlineUserIds.includes(userId)),
    })),

  setTypingState: (userId, isTyping) =>
    set((state) => {
      const participant = state.participants.find((entry) => entry.userId === userId);
      if (participant?.isSelf) {
        return state;
      }

      const typingUserIds = isTyping
        ? Array.from(new Set([...state.typingUserIds, userId]))
        : state.typingUserIds.filter((id) => id !== userId);

      return { typingUserIds };
    }),

  setAiPending: (kind, pending) =>
    set((state) => ({
      aiPending: {
        ...state.aiPending,
        [kind]: pending,
      },
      lastError: pending ? null : state.lastError,
    })),

  setLastError: (message) => set({ lastError: message, aiPending: initialAiPending() }),

  prependNarration: (entry) =>
    set((state) => ({
      narrationFeed: [entry, ...state.narrationFeed.filter((currentEntry) => currentEntry.id !== entry.id)].sort(
        (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
      ),
      aiPending: {
        ...state.aiPending,
        narration: false,
      },
      typingUserIds:
        entry.authorId === null
          ? state.typingUserIds
          : state.typingUserIds.filter((userId) => userId !== entry.authorId),
      lastError: null,
    })),

  addWorldEvent: (event) =>
    set((state) => ({
      worldEvents: sortWorldEvents([
        event,
        ...state.worldEvents.filter((currentEvent) => currentEvent.id !== event.id),
      ]),
      aiPending: {
        ...state.aiPending,
        worldEvent: false,
      },
      lastError: null,
    })),

  addDiceRoll: (roll, currentUser) =>
    set((state) => ({
      diceHistory: [roll, ...state.diceHistory.filter((currentRoll) => currentRoll.id !== roll.id)],
      lastDiceRoll: buildLiveDiceRoll(roll, state.participants, currentUser),
    })),

  upsertToken: (token) =>
    set((state) => ({
      mapTokens: state.mapTokens.some((currentToken) => currentToken.id === token.id)
        ? state.mapTokens.map((currentToken) => (currentToken.id === token.id ? token : currentToken))
        : [...state.mapTokens, token],
    })),

  removeToken: (tokenId) =>
    set((state) => ({
      mapTokens: state.mapTokens.filter((token) => token.id !== tokenId),
    })),

  updateMap: (map) =>
    set({
      activeMap: map,
      revealState: normalizeRevealState(map.reveal_state),
    }),

  setSessionState: (sessionState) => set({ sessionState }),

  setActiveTurnTokenId: (tokenId) => set({ activeTurnTokenId: tokenId }),

  reset: () => set(createInitialState()),
}));
