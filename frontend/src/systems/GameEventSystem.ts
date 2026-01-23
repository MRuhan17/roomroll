/**
* Game Event System
* 
* Responsible for managing the lifecycle of game events:
* 1. Creation & Validation
* 2. Ordering (Sequence ID)
* 3. Broadcasting
* 4. History / Replay
* 
* Ensures all clients see the same sequence of events.
*/

import { type GameEvent, GameEventType } from "../models/GameEvents";

type EventListener = (event: GameEvent) => void;

export class GameEventSystem {
    private static instance: GameEventSystem;

    // The single source of truth for event history
    private eventHistory: GameEvent[] = [];
    private listeners: Set<EventListener> = new Set();

    // Strict ordering
    private nextSequenceId = 1;

    private constructor() { }

    public static getInstance(): GameEventSystem {
        if (!GameEventSystem.instance) {
            GameEventSystem.instance = new GameEventSystem();
        }
        return GameEventSystem.instance;
    }

    /**
     * Publishes an event to the system.
     * Assigns a timestamp and guarantees order locally.
     * In a real app, this would send to the server first.
     */
    public publish(event: Omit<GameEvent, 'id' | 'timestamp'>): void {
        const fullEvent: GameEvent = {
            ...event,
            id: this.generateEventId(),
            timestamp: Date.now(),
        } as GameEvent;

        this.processEvent(fullEvent);
    }

    /**
     * Processes an incoming event (from local or remote).
     * Adds to history and notifies listeners.
     */
    public processEvent(event: GameEvent): void {
        // 1. Store in immutable history
        this.eventHistory.push(event);

        // 2. Broadcast to all listeners (UI components)
        this.notifyListeners(event);

        console.log(`[GameEventSystem] Processed event #${this.eventHistory.length}: ${event.type}`, event);
    }

    public subscribe(listener: EventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(event: GameEvent): void {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('[GameEventSystem] Listener error:', error);
            }
        });
    }

    public getHistory(): GameEvent[] {
        return [...this.eventHistory];
    }

    public getEventsByType(type: GameEventType): GameEvent[] {
        return this.eventHistory.filter(e => e.type === type);
    }

    private generateEventId(): string {
        return `evt-${Date.now()}-${this.nextSequenceId++}`;
    }
}

export const eventSystem = GameEventSystem.getInstance();
