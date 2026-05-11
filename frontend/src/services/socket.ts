import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { useRoomStore } from "@/store/roomStore";
import type {
  CampaignMap,
  CampaignMapToken,
  CampaignSessionState,
  CampaignSocketStatePayload,
  CampaignWorldEvent,
  DiceRollRow,
  NarrationEntry,
  NarrationSource,
} from "@/types/campaign";

const baseURL = import.meta.env.NEXT_PUBLIC_SOCKET_URL;

const SocketEvents = {
  Error: "ERROR",
  JoinCampaign: "JOIN_CAMPAIGN",
  LeaveCampaign: "LEAVE_CAMPAIGN",
  RequestAiNarration: "REQUEST_AI_NARRATION",
  RequestAiWorldEvent: "REQUEST_AI_WORLD_EVENT",
  PlayerJoined: "PLAYER_JOINED",
  PlayerLeft: "PLAYER_LEFT",
  PlayerTyping: "PLAYER_TYPING",
  DiceRolled: "DICE_ROLLED",
  TokenMoved: "TOKEN_MOVED",
  MapRevealed: "MAP_REVEALED",
  NewNarration: "NEW_NARRATION",
  WorldEvent: "WORLD_EVENT",
  SessionStarted: "SESSION_STARTED",
  SessionEnded: "SESSION_ENDED",
  CampaignState: "CAMPAIGN_STATE",
  MapPing: "MAP_PING",
  TokenCreated: "TOKEN_CREATED",
  TokenUpdated: "TOKEN_UPDATED",
  TokenDeleted: "TOKEN_DELETED",
  CombatTurn: "COMBAT_TURN",
} as const;

let socket: Socket | null = null;
let socketToken: string | null = null;

function fallbackLabel(userId: number, source: NarrationSource) {
  return source === "dm" ? `Dungeon Master #${userId}` : `Adventurer #${userId}`;
}

function buildNarrationEntry(userId: number, text: string, ai?: boolean): NarrationEntry {
  const { participants } = useRoomStore.getState();
  const currentUser = useAuthStore.getState().user;
  const participant = participants.find((entry) => entry.userId === userId);

  let source: NarrationSource = "player";
  if (ai) {
    source = "ai";
  } else if (participant?.role === "DM") {
    source = "dm";
  }

  return {
    id: `live:${userId}:${Date.now()}`,
    text,
    source,
    authorId: userId,
    authorLabel:
      participant?.label ??
      (currentUser?.id === userId ? currentUser.displayName : fallbackLabel(userId, source)),
    createdAt: new Date().toISOString(),
  };
}

function registerSocketListeners(activeSocket: Socket) {
  activeSocket.on("connect", () => {
    useRoomStore.getState().setSocketConnected(true);
    useRoomStore.getState().setLastError(null);
  });

  activeSocket.on("disconnect", () => {
    useRoomStore.getState().setSocketConnected(false);
  });

  activeSocket.on("connect_error", (error: Error) => {
    useRoomStore.getState().setSocketConnected(false);
    useRoomStore.getState().setLastError(error.message);
  });

  activeSocket.on(SocketEvents.Error, (payload: { message?: string }) => {
    useRoomStore.getState().setLastError(payload.message ?? "Realtime request failed.");
  });

  activeSocket.on(SocketEvents.CampaignState, (payload: CampaignSocketStatePayload) => {
    const currentUser = useAuthStore.getState().user;
    useRoomStore
      .getState()
      .applyCampaignSnapshot(payload.snapshot, currentUser, payload.onlineUserIds ?? []);
  });

  activeSocket.on(SocketEvents.PlayerJoined, (payload: { onlineUserIds: number[] }) => {
    const currentUser = useAuthStore.getState().user;
    useRoomStore.getState().setOnlineUserIds(payload.onlineUserIds ?? [], currentUser);
  });

  activeSocket.on(SocketEvents.PlayerLeft, (payload: { onlineUserIds: number[] }) => {
    const currentUser = useAuthStore.getState().user;
    useRoomStore.getState().setOnlineUserIds(payload.onlineUserIds ?? [], currentUser);
  });

  activeSocket.on(SocketEvents.PlayerTyping, (payload: { userId?: number; isTyping?: boolean }) => {
    if (!payload.userId) {
      return;
    }

    useRoomStore.getState().setTypingState(payload.userId, Boolean(payload.isTyping));
  });

  activeSocket.on(SocketEvents.DiceRolled, (payload: { roll?: DiceRollRow }) => {
    if (!payload.roll) {
      return;
    }

    const currentUser = useAuthStore.getState().user;
    useRoomStore.getState().addDiceRoll(payload.roll, currentUser);
  });

  activeSocket.on(SocketEvents.TokenMoved, (payload: { token?: CampaignMapToken }) => {
    if (payload.token) {
      useRoomStore.getState().upsertToken(payload.token);
    }
  });

  activeSocket.on(SocketEvents.TokenCreated, (payload: { token?: CampaignMapToken }) => {
    if (payload.token) {
      useRoomStore.getState().upsertToken(payload.token);
    }
  });

  activeSocket.on(SocketEvents.TokenUpdated, (payload: { token?: CampaignMapToken }) => {
    if (payload.token) {
      useRoomStore.getState().upsertToken(payload.token);
    }
  });

  activeSocket.on(SocketEvents.TokenDeleted, (payload: { tokenId?: number }) => {
    if (typeof payload.tokenId === "number") {
      useRoomStore.getState().removeToken(payload.tokenId);
    }
  });

  activeSocket.on(SocketEvents.MapRevealed, (payload: { map?: CampaignMap }) => {
    if (payload.map) {
      useRoomStore.getState().updateMap(payload.map);
    }
  });

  activeSocket.on(SocketEvents.NewNarration, (payload: { userId?: number; text?: string; ai?: boolean }) => {
    if (typeof payload.userId !== "number" || typeof payload.text !== "string") {
      return;
    }

    useRoomStore.getState().prependNarration(buildNarrationEntry(payload.userId, payload.text, payload.ai));
  });

  activeSocket.on(SocketEvents.WorldEvent, (payload: { event?: CampaignWorldEvent }) => {
    if (payload.event) {
      useRoomStore.getState().addWorldEvent(payload.event);
    }
  });

  activeSocket.on(SocketEvents.SessionStarted, (payload: { state?: CampaignSessionState }) => {
    useRoomStore.getState().setSessionState(payload.state ?? null);
  });

  activeSocket.on(SocketEvents.SessionEnded, (payload: { state?: CampaignSessionState }) => {
    useRoomStore.getState().setSessionState(payload.state ?? null);
  });

  activeSocket.on(SocketEvents.CombatTurn, (payload: { tokenId?: number }) => {
    useRoomStore.getState().setActiveTurnTokenId(payload.tokenId ?? null);
  });
}

export const connectSocket = (token: string) => {
  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }

  if (!socket) {
    socket = io(baseURL, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      secure: true,
    });
    socketToken = token;
    registerSocketListeners(socket);
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketToken = null;
  }
};

export { SocketEvents };
