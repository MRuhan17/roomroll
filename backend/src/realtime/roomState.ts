import { Server, Socket } from 'socket.io';
import { createLogger } from '../lib/logger';

interface SocketUser {
    userId: number;
    displayName: string;
    roomId: string;
}

export interface PlayerToken {
    userId: number;
    displayName: string;
    x: number;
    y: number;
    color: string;
}

export interface DiceRoll {
    userId: number;
    displayName: string;
    type: string;
    result: number;
    timestamp: number;
}

export interface Npc {
    id: string;
    name: string;
    description: string;
    hp: number;
    ac: number;
    x: number;
    y: number;
}

export interface RoomState {
    tokens: Record<number, PlayerToken>;
    npcs: Npc[];
    lastAction?: string;
    lastDiceRoll?: DiceRoll;
    updatedAt: number;
}

const logger = createLogger('socket');
const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
const socketUsers = new Map<string, SocketUser>();

export const roomStates = new Map<string, RoomState>();

let io: Server | null = null;

function isValidRoomJoinPayload(data: unknown): data is { roomId: string; userId: number; displayName: string } {
    return Boolean(
        data &&
            typeof data === 'object' &&
            typeof (data as { roomId?: unknown }).roomId === 'string' &&
            Number.isFinite((data as { userId?: unknown }).userId) &&
            typeof (data as { displayName?: unknown }).displayName === 'string'
    );
}

function isValidTokenUpdatePayload(data: unknown): data is { x: number; y: number } {
    return Boolean(
        data &&
            typeof data === 'object' &&
            Number.isFinite((data as { x?: unknown }).x) &&
            Number.isFinite((data as { y?: unknown }).y)
    );
}

function isValidDicePayload(data: unknown): data is { type: string } {
    return Boolean(data && typeof data === 'object' && typeof (data as { type?: unknown }).type === 'string');
}

function createCoordinate() {
    return Math.floor(Math.random() * 200) + 50;
}

function ensureRoomState(roomId: string) {
    let state = roomStates.get(roomId);

    if (!state) {
        state = {
            tokens: {},
            npcs: [],
            updatedAt: Date.now(),
        };
        roomStates.set(roomId, state);
    }

    return state;
}

function emitRoomState(roomId: string, state: RoomState) {
    io?.to(roomId).emit('state_sync', state);
}

function resolveDiceMax(type: string) {
    switch (type) {
        case 'd4':
            return 4;
        case 'd6':
            return 6;
        case 'd8':
            return 8;
        case 'd10':
            return 10;
        case 'd12':
            return 12;
        case 'd100':
        case 'd%':
            return 100;
        default:
            return 20;
    }
}

function handleJoinRoom(socket: Socket, data: unknown) {
    if (!isValidRoomJoinPayload(data)) {
        logger.warn('Rejected invalid join_room payload', { socketId: socket.id, payload: data as Record<string, unknown> });
        return;
    }

    const roomId = data.roomId.trim();
    const displayName = data.displayName.trim();

    if (!roomId || !displayName) {
        logger.warn('Rejected empty join_room fields', { socketId: socket.id });
        return;
    }

    const previousUser = socketUsers.get(socket.id);
    if (previousUser && previousUser.roomId !== roomId) {
        socket.leave(previousUser.roomId);
        socket.to(previousUser.roomId).emit('user_left', {
            userId: previousUser.userId,
            displayName: previousUser.displayName,
            message: `${previousUser.displayName} has left the room.`,
        });
    }

    socketUsers.set(socket.id, {
        userId: data.userId,
        displayName,
        roomId,
    });

    socket.join(roomId);

    logger.info('User joined room', {
        socketId: socket.id,
        roomId,
        userId: data.userId,
        displayName,
    });

    socket.to(roomId).emit('user_joined', {
        userId: data.userId,
        displayName,
        message: `${displayName} has joined the room.`,
    });

    const state = ensureRoomState(roomId);

    if (!state.tokens[data.userId]) {
        state.tokens[data.userId] = {
            userId: data.userId,
            displayName,
            x: createCoordinate(),
            y: createCoordinate(),
            color: COLORS[Object.keys(state.tokens).length % COLORS.length],
        };
        state.updatedAt = Date.now();
        emitRoomState(roomId, state);
        return;
    }

    socket.emit('state_sync', state);
}

function handleTokenUpdate(socket: Socket, data: unknown) {
    if (!isValidTokenUpdatePayload(data)) {
        logger.warn('Rejected invalid update_token payload', { socketId: socket.id, payload: data as Record<string, unknown> });
        return;
    }

    const user = socketUsers.get(socket.id);
    if (!user) {
        return;
    }

    const state = roomStates.get(user.roomId);
    if (!state || !state.tokens[user.userId]) {
        return;
    }

    state.tokens[user.userId].x = data.x;
    state.tokens[user.userId].y = data.y;
    state.lastAction = `${user.displayName} moved.`;
    state.updatedAt = Date.now();

    emitRoomState(user.roomId, state);
}

function handleDiceRoll(socket: Socket, data: unknown) {
    if (!isValidDicePayload(data)) {
        logger.warn('Rejected invalid roll_dice payload', { socketId: socket.id, payload: data as Record<string, unknown> });
        return;
    }

    const user = socketUsers.get(socket.id);
    if (!user) {
        return;
    }

    const state = roomStates.get(user.roomId);
    if (!state) {
        return;
    }

    const max = resolveDiceMax(data.type);
    const result = Math.floor(Math.random() * max) + 1;

    const roll: DiceRoll = {
        userId: user.userId,
        displayName: user.displayName,
        type: data.type,
        result,
        timestamp: Date.now(),
    };

    state.lastDiceRoll = roll;
    state.lastAction = `${user.displayName} rolled a ${data.type} and got ${result}.`;
    state.updatedAt = Date.now();

    io?.to(user.roomId).emit('dice_rolled', roll);
    emitRoomState(user.roomId, state);
}

function handleDisconnect(socket: Socket) {
    logger.info('Socket disconnected', { socketId: socket.id });

    const user = socketUsers.get(socket.id);
    if (!user) {
        return;
    }

    socket.to(user.roomId).emit('user_left', {
        userId: user.userId,
        displayName: user.displayName,
        message: `${user.displayName} has left the room.`,
    });

    socketUsers.delete(socket.id);
}

export function broadcastRoomState(roomId: string) {
    const state = roomStates.get(roomId);
    if (!state) {
        return;
    }

    emitRoomState(roomId, state);
}

export function registerRealtimeHandlers(server: Server) {
    io = server;

    server.on('connection', (socket) => {
        logger.info('Socket connected', { socketId: socket.id });

        socket.on('join_room', (data) => handleJoinRoom(socket, data));
        socket.on('update_token', (data) => handleTokenUpdate(socket, data));
        socket.on('roll_dice', (data) => handleDiceRoll(socket, data));
        socket.on('disconnect', () => handleDisconnect(socket));
    });
}
