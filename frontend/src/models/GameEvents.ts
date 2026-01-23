/**
 * Game Event Definitions
 * 
 * Defines the shared events that drive the game state.
 * These events are strictly typed to ensure consistency across clients.
 */

import type { RollResult } from "../systems/DiceSystem";

export const GameEventType = {
    // Dice Events
    DICE_ROLLED: 'DICE_ROLLED',

    // Map Events
    MAP_CHANGED: 'MAP_CHANGED',
    TOKEN_MOVED: 'TOKEN_MOVED',

    // Chat Events
    CHAT_MESSAGE: 'CHAT_MESSAGE',

    // Session Events
    SESSION_PAUSED: 'SESSION_PAUSED',
    SESSION_RESUMED: 'SESSION_RESUMED',
} as const;

export type GameEventType = typeof GameEventType[keyof typeof GameEventType];

export interface BaseGameEvent {
    id: string;
    type: GameEventType;
    timestamp: number;
    actorId: string; // User ID of who triggered the event
}

export interface DiceRolledEvent extends BaseGameEvent {
    type: typeof GameEventType.DICE_ROLLED;
    payload: RollResult;
}

export interface MapChangedEvent extends BaseGameEvent {
    type: typeof GameEventType.MAP_CHANGED;
    payload: {
        mapId: string;
        mapUrl?: string;
    };
}

export interface TokenMovedEvent extends BaseGameEvent {
    type: typeof GameEventType.TOKEN_MOVED;
    payload: {
        tokenId: string;
        x: number;
        y: number;
        oldX?: number;
        oldY?: number;
    };
}

export interface ChatMessageEvent extends BaseGameEvent {
    type: typeof GameEventType.CHAT_MESSAGE;
    payload: {
        message: string;
        senderName: string;
    };
}

// Union type for all events
export type GameEvent =
    | DiceRolledEvent
    | MapChangedEvent
    | TokenMovedEvent
    | ChatMessageEvent;
