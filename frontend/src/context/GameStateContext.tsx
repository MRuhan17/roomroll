/**
 * Game State Context
 * 
 * Manages the user's current game state (UNAUTHENTICATED, AUTHENTICATED, IN_LOBBY, IN_SESSION)
 * and provides functions to transition between states.
 * 
 * This context integrates with the AuthContext and enforces the game state model.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
    UserState,
    UserRole,
    type UserStateContext,
    transitionUserState,
} from '../models/GameState';

interface GameStateContextType {
    userState: UserStateContext;
    joinLobby: (lobbyId: string, role: UserRole) => void;
    leaveLobby: () => void;
    enterSession: (sessionId: string) => void;
    leaveSession: () => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    // Initialize state based on authentication status
    const [userState, setUserState] = useState<UserStateContext>({
        state: UserState.UNAUTHENTICATED,
        userId: null,
        lobbyId: null,
        sessionId: null,
    });

    // Sync with authentication state
    useEffect(() => {
        if (isAuthenticated && user && userState.state === UserState.UNAUTHENTICATED) {
            // Transition: UNAUTHENTICATED -> AUTHENTICATED
            try {
                const newState = transitionUserState(
                    userState,
                    UserState.AUTHENTICATED,
                    { userId: user.id }
                );
                setUserState(newState);
            } catch (error) {
                console.error('Failed to transition to AUTHENTICATED:', error);
            }
        } else if (!isAuthenticated && userState.state !== UserState.UNAUTHENTICATED) {
            // Transition: Any state -> UNAUTHENTICATED (logout)
            setUserState({
                state: UserState.UNAUTHENTICATED,
                userId: null,
                lobbyId: null,
                sessionId: null,
            });
        }
    }, [isAuthenticated, user, userState]);

    /**
     * Join a lobby with a specific role (DM or PLAYER).
     * Transitions: AUTHENTICATED -> IN_LOBBY
     */
    const joinLobby = (lobbyId: string, role: UserRole) => {
        try {
            const newState = transitionUserState(
                userState,
                UserState.IN_LOBBY,
                { lobbyId, role }
            );
            setUserState(newState);
        } catch (error) {
            console.error('Failed to join lobby:', error);
            throw error;
        }
    };

    /**
     * Leave the current lobby.
     * Transitions: IN_LOBBY -> AUTHENTICATED
     */
    const leaveLobby = () => {
        try {
            const newState = transitionUserState(
                userState,
                UserState.AUTHENTICATED,
                {}
            );
            setUserState(newState);
        } catch (error) {
            console.error('Failed to leave lobby:', error);
            throw error;
        }
    };

    /**
     * Enter a session (when DM starts it).
     * Transitions: IN_LOBBY -> IN_SESSION
     */
    const enterSession = (sessionId: string) => {
        try {
            const newState = transitionUserState(
                userState,
                UserState.IN_SESSION,
                { sessionId }
            );
            setUserState(newState);
        } catch (error) {
            console.error('Failed to enter session:', error);
            throw error;
        }
    };

    /**
     * Leave the current session (when it ends).
     * Transitions: IN_SESSION -> IN_LOBBY
     */
    const leaveSession = () => {
        try {
            const newState = transitionUserState(
                userState,
                UserState.IN_LOBBY,
                {}
            );
            setUserState(newState);
        } catch (error) {
            console.error('Failed to leave session:', error);
            throw error;
        }
    };

    return (
        <GameStateContext.Provider
            value={{
                userState,
                joinLobby,
                leaveLobby,
                enterSession,
                leaveSession,
            }}
        >
            {children}
        </GameStateContext.Provider>
    );
};

export const useGameState = () => {
    const context = useContext(GameStateContext);
    if (context === undefined) {
        throw new Error('useGameState must be used within a GameStateProvider');
    }
    return context;
};
