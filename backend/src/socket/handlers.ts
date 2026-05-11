import { Server, Socket } from 'socket.io';
import { verifyToken } from '../services/authService';
import { presenceStore } from '../campaign-engine/presenceStore';
import { getCampaignSnapshot } from '../services/campaignStateService';
import { getMember } from '../services/campaignService';
import { isDiceType, rollDice, storeDiceRoll } from '../services/diceService';
import { createToken, moveToken, updateToken, deleteToken } from '../services/tokenService';
import { updateRevealState } from '../services/mapService';
import { createCampaignEvent } from '../services/eventService';
import { appendNarrationLog } from '../services/memoryService';
import { createWorldEvent } from '../services/worldEventService';
import { upsertQuest } from '../services/questService';
import { startSession, endSession } from '../services/sessionService';
import { generateNarration, generateAiWorldEvent, updateNpcRelationship } from '../ai/aiService';
import { SocketEvents } from '../types/socket';
import { DiceRollRequest } from '../types/dice';
import { AuthUser } from '../types/auth';
import { createLogger } from '../lib/logger';

const logger = createLogger('socket');

const getTokenFromSocket = (socket: Socket): string | null => {
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
        return authToken;
    }
    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.length > 0) {
        return header.startsWith('Bearer ') ? header.slice(7) : header;
    }
    return null;
};

const campaignRoom = (campaignId: number): string => `campaign:${campaignId}`;

const leaveCampaignRoom = (socket: Socket, io: Server) => {
    const campaignId = socket.data.campaignId as number | undefined;
    const user = socket.data.user as AuthUser | undefined;
    if (!campaignId || !user) {
        return;
    }
    const presence = presenceStore.leave(campaignId, user.id, socket.id);
    socket.leave(campaignRoom(campaignId));
    socket.data.campaignId = undefined;
    if (presence.changed) {
        io.to(campaignRoom(campaignId)).emit(SocketEvents.PlayerLeft, {
            userId: user.id,
            onlineUserIds: presence.onlineUserIds
        });
    }
};

export const registerSocketHandlers = (io: Server) => {
    io.use((socket, next) => {
        const token = getTokenFromSocket(socket);
        if (!token) {
            return next(new Error('Unauthorized'));
        }
        try {
            const user = verifyToken(token);
            socket.data.user = user;
            return next();
        } catch (error) {
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.data.user as AuthUser;
        logger.info('User connected', { userId: user.id, socketId: socket.id });

        socket.on(SocketEvents.JoinCampaign, async (payload: { campaignId?: number }) => {
            const campaignId = Number(payload?.campaignId);
            logger.info('Joining campaign', { userId: user.id, campaignId });
            if (!campaignId) {
                socket.emit(SocketEvents.Error, { message: 'campaignId required' });
                return;
            }
            const member = await getMember(campaignId, user.id);
            if (!member) {
                socket.emit(SocketEvents.Error, { message: 'Not a campaign member' });
                return;
            }
            leaveCampaignRoom(socket, io);
            socket.join(campaignRoom(campaignId));
            socket.data.campaignId = campaignId;

            const presence = presenceStore.join(campaignId, user.id, socket.id);
            if (presence.changed) {
                socket.to(campaignRoom(campaignId)).emit(SocketEvents.PlayerJoined, {
                    userId: user.id,
                    onlineUserIds: presence.onlineUserIds
                });
            }

            const snapshot = await getCampaignSnapshot(campaignId);
            socket.emit(SocketEvents.CampaignState, {
                snapshot,
                onlineUserIds: presence.onlineUserIds
            });
        });

        socket.on(SocketEvents.LeaveCampaign, () => {
            leaveCampaignRoom(socket, io);
        });

        socket.on(SocketEvents.PlayerTyping, (payload: { isTyping?: boolean }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId) {
                return;
            }
            socket.to(campaignRoom(campaignId)).emit(SocketEvents.PlayerTyping, {
                userId: user.id,
                isTyping: Boolean(payload?.isTyping)
            });
        });

        socket.on(SocketEvents.DiceRolled, async (payload: DiceRollRequest & { context?: string }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.diceType || !isDiceType(payload.diceType)) {
                return;
            }
            const roll = rollDice(payload);
            const storedRoll = await storeDiceRoll(campaignId, user.id, roll, payload.context);
            await createCampaignEvent(campaignId, 'DICE_ROLLED', { roll: storedRoll }, user.id);
            io.to(campaignRoom(campaignId)).emit(SocketEvents.DiceRolled, {
                userId: user.id,
                roll: storedRoll
            });
        });

        socket.on(SocketEvents.TokenMoved, async (payload: { tokenId?: number; position?: { x: number; y: number; snapped?: boolean } }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.tokenId || !payload?.position) {
                return;
            }
            const token = await moveToken(campaignId, payload.tokenId, payload.position);
            io.to(campaignRoom(campaignId)).emit(SocketEvents.TokenMoved, {
                userId: user.id,
                token
            });
        });

        socket.on(SocketEvents.TokenCreated, async (payload: { mapId?: number; tokenType?: 'player' | 'enemy' | 'npc' | 'boss'; label?: string; hpCurrent?: number; hpMax?: number; position?: { x: number; y: number; snapped?: boolean }; isHidden?: boolean }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.mapId || !payload?.tokenType || !payload?.position) {
                return;
            }
            const token = await createToken({
                campaignId,
                mapId: payload.mapId,
                tokenType: payload.tokenType,
                label: payload.label,
                hpCurrent: payload.hpCurrent,
                hpMax: payload.hpMax,
                position: payload.position,
                isHidden: payload.isHidden
            });
            io.to(campaignRoom(campaignId)).emit(SocketEvents.TokenCreated, {
                userId: user.id,
                token
            });
        });

        socket.on(SocketEvents.TokenUpdated, async (payload: { tokenId?: number; hpCurrent?: number; hpMax?: number; label?: string; isHidden?: boolean }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.tokenId) {
                return;
            }
            const token = await updateToken(campaignId, payload.tokenId, {
                hp_current: payload.hpCurrent,
                hp_max: payload.hpMax,
                label: payload.label,
                is_hidden: payload.isHidden
            });
            io.to(campaignRoom(campaignId)).emit(SocketEvents.TokenUpdated, {
                userId: user.id,
                token
            });
        });

        socket.on(SocketEvents.TokenDeleted, async (payload: { tokenId?: number }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.tokenId) {
                return;
            }
            await deleteToken(campaignId, payload.tokenId);
            io.to(campaignRoom(campaignId)).emit(SocketEvents.TokenDeleted, {
                userId: user.id,
                tokenId: payload.tokenId
            });
        });

        socket.on(SocketEvents.MapViewport, (payload: { x?: number; y?: number; zoom?: number }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || payload?.x == null || payload?.y == null || payload?.zoom == null) {
                return;
            }
            socket.to(campaignRoom(campaignId)).emit(SocketEvents.MapViewport, {
                userId: user.id,
                x: payload.x,
                y: payload.y,
                zoom: payload.zoom
            });
        });

        socket.on(SocketEvents.CombatTurn, (payload: { tokenId?: number; round?: number }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId) {
                return;
            }
            io.to(campaignRoom(campaignId)).emit(SocketEvents.CombatTurn, {
                userId: user.id,
                tokenId: payload.tokenId,
                round: payload.round
            });
        });

        socket.on(SocketEvents.MapRevealed, async (payload: { mapId?: number; revealState?: Record<string, unknown> }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.mapId || !payload?.revealState) {
                return;
            }
            const map = await updateRevealState(campaignId, payload.mapId, payload.revealState);
            io.to(campaignRoom(campaignId)).emit(SocketEvents.MapRevealed, {
                userId: user.id,
                map
            });
        });

        socket.on(SocketEvents.NewNarration, async (payload: { text?: string }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.text) {
                return;
            }
            await createCampaignEvent(campaignId, 'NEW_NARRATION', { text: payload.text }, user.id);
            await appendNarrationLog(campaignId, {
                created_at: new Date().toISOString(),
                content: payload.text,
                created_by: user.id
            });
            io.to(campaignRoom(campaignId)).emit(SocketEvents.NewNarration, {
                userId: user.id,
                text: payload.text
            });
        });

        socket.on(SocketEvents.RequestAiNarration, async (payload: { playerAction?: string; tone?: string }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.playerAction) {
                return;
            }
            const narration = await generateNarration({
                campaignId,
                userId: user.id,
                playerAction: payload.playerAction,
                tone: payload.tone as 'cinematic' | 'mysterious' | 'intense' | 'light' | undefined
            });
            io.to(campaignRoom(campaignId)).emit(SocketEvents.NewNarration, {
                userId: user.id,
                text: narration.narration,
                ai: true
            });
        });

        socket.on(SocketEvents.WorldEvent, async (payload: { title?: string; description?: string; status?: string }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.title) {
                return;
            }
            const event = await createWorldEvent({
                campaignId,
                title: payload.title,
                description: payload.description,
                status: payload.status,
                createdBy: user.id
            });
            io.to(campaignRoom(campaignId)).emit(SocketEvents.WorldEvent, {
                userId: user.id,
                event
            });
        });

        socket.on(SocketEvents.RequestAiWorldEvent, async () => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId) return;
            try {
                const aiEvent = await generateAiWorldEvent(campaignId, user.id);
                const event = await createWorldEvent({
                    campaignId,
                    title: aiEvent.title,
                    description: aiEvent.description,
                    status: 'active',
                    createdBy: user.id
                });
                io.to(campaignRoom(campaignId)).emit(SocketEvents.WorldEvent, {
                    userId: user.id,
                    event
                });
            } catch (err) {
                socket.emit(SocketEvents.Error, { message: err instanceof Error ? err.message : 'AI error' });
            }
        });

        socket.on('UPDATE_NPC_RELATIONSHIP', async (payload: { npcName?: string; context?: string }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.npcName || !payload?.context) return;
            await updateNpcRelationship(campaignId, payload.npcName, payload.context);
        });

        socket.on(SocketEvents.QuestUpdated, async (payload: { questId?: number; title?: string; description?: string; status?: string; progress?: Record<string, unknown> }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || !payload?.title) {
                return;
            }
            const quest = await upsertQuest({
                campaignId,
                questId: payload.questId,
                title: payload.title,
                description: payload.description,
                status: payload.status,
                progress: payload.progress
            });
            io.to(campaignRoom(campaignId)).emit(SocketEvents.QuestUpdated, {
                userId: user.id,
                quest
            });
        });

        socket.on(SocketEvents.SessionStarted, async () => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId) {
                return;
            }
            const state = await startSession(campaignId, user.id);
            io.to(campaignRoom(campaignId)).emit(SocketEvents.SessionStarted, {
                userId: user.id,
                state
            });
        });

        socket.on(SocketEvents.SessionEnded, async (payload: { summary?: string }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId) {
                return;
            }
            const state = await endSession(campaignId, user.id, payload?.summary);
            io.to(campaignRoom(campaignId)).emit(SocketEvents.SessionEnded, {
                userId: user.id,
                state
            });
        });

        socket.on(SocketEvents.MapPing, (payload: { x?: number; y?: number }) => {
            const campaignId = socket.data.campaignId as number | undefined;
            if (!campaignId || payload?.x == null || payload?.y == null) {
                return;
            }
            socket.to(campaignRoom(campaignId)).emit(SocketEvents.MapPing, {
                userId: user.id,
                x: payload.x,
                y: payload.y
            });
        });

        socket.on('disconnect', (reason) => {
            logger.info('User disconnected', { userId: user.id, socketId: socket.id, reason });
            leaveCampaignRoom(socket, io);
        });
    });
};
