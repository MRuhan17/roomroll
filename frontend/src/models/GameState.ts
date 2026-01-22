/**
 * Core Game State Model
 * 
 * This module defines the single source of truth for:
 * - User progression through the application
 * - Lobby participation and membership
 * - Session lifecycle management
 * 
 * Design Principles:
 * - States are mutually exclusive (user cannot be in multiple states)
 * - Transitions are explicit and validated
 * - Invalid state transitions are prevented at compile time where possible
 */

// ============================================================================
// USER STATES
// ============================================================================

/**
 * Represents the authentication and participation state of a user.
 * 
 * State Progression:
 * UNAUTHENTICATED -> AUTHENTICATED -> IN_LOBBY -> IN_SESSION
 * 
 * Users can only move forward through states or return to AUTHENTICATED.
 */
export const UserState = {
    /**
     * User is not logged in.
     * Can transition to: AUTHENTICATED (via login/signup)
     */
    UNAUTHENTICATED: 'UNAUTHENTICATED',

    /**
     * User is logged in but not in any lobby.
     * Can transition to: IN_LOBBY (via join/create), UNAUTHENTICATED (via logout)
     */
    AUTHENTICATED: 'AUTHENTICATED',

    /**
     * User is in a lobby waiting for session to start.
     * Can transition to: IN_SESSION (DM starts session), AUTHENTICATED (via leave lobby)
     */
    IN_LOBBY: 'IN_LOBBY',

    /**
     * User is actively participating in a game session.
     * Can transition to: AUTHENTICATED (session ends or user leaves)
     */
    IN_SESSION: 'IN_SESSION',
} as const;

export type UserState = typeof UserState[keyof typeof UserState];

// ============================================================================
// LOBBY STATES
// ============================================================================

/**
 * Represents the lifecycle state of a lobby.
 * 
 * State Progression:
 * FORMING -> READY -> ACTIVE -> COMPLETED
 * 
 * A lobby can also be DISBANDED at any point before ACTIVE.
 */
export const LobbyState = {
    /**
     * Lobby is being created, waiting for minimum members.
     * Can transition to: READY (min members joined), DISBANDED (creator cancels)
     */
    FORMING: 'FORMING',

    /**
     * Lobby has minimum members and can start.
     * Can transition to: ACTIVE (DM starts session), DISBANDED (all leave)
     */
    READY: 'READY',

    /**
     * Session is in progress.
     * Can transition to: COMPLETED (session ends)
     */
    ACTIVE: 'ACTIVE',

    /**
     * Session has ended.
     * Terminal state - no further transitions.
     */
    COMPLETED: 'COMPLETED',

    /**
     * Lobby was cancelled before session started.
     * Terminal state - no further transitions.
     */
    DISBANDED: 'DISBANDED',
} as const;

export type LobbyState = typeof LobbyState[keyof typeof LobbyState];

// ============================================================================
// SESSION STATES
// ============================================================================

/**
 * Represents the lifecycle of an active game session.
 * 
 * State Progression:
 * STARTING -> IN_PROGRESS -> PAUSED <-> IN_PROGRESS -> ENDED
 */
export const SessionState = {
    /**
     * Session is initializing (loading resources, setting up board).
     * Can transition to: IN_PROGRESS (initialization complete)
     */
    STARTING: 'STARTING',

    /**
     * Session is actively running.
     * Can transition to: PAUSED (DM pauses), ENDED (DM ends session)
     */
    IN_PROGRESS: 'IN_PROGRESS',

    /**
     * Session is temporarily paused.
     * Can transition to: IN_PROGRESS (DM resumes), ENDED (DM ends session)
     */
    PAUSED: 'PAUSED',

    /**
     * Session has concluded.
     * Terminal state - no further transitions.
     */
    ENDED: 'ENDED',
} as const;

export type SessionState = typeof SessionState[keyof typeof SessionState];

// ============================================================================
// USER ROLES
// ============================================================================

/**
 * Defines user roles within a lobby/session.
 * Roles determine what state transitions a user can trigger.
 */
export const UserRole = {
    /**
     * Dungeon Master - has control over session lifecycle.
     * Can: start session, pause/resume, end session
     */
    DM: 'DM',

    /**
     * Player - participates in session.
     * Can: join/leave lobby, interact during session
     */
    PLAYER: 'PLAYER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// ============================================================================
// STATE TRANSITION VALIDATORS
// ============================================================================

/**
 * Validates whether a user state transition is allowed.
 * 
 * @param from - Current user state
 * @param to - Desired user state
 * @returns true if transition is valid, false otherwise
 */
export function isValidUserStateTransition(from: UserState, to: UserState): boolean {
    const validTransitions: Record<UserState, UserState[]> = {
        [UserState.UNAUTHENTICATED]: [UserState.AUTHENTICATED],
        [UserState.AUTHENTICATED]: [UserState.IN_LOBBY, UserState.UNAUTHENTICATED],
        [UserState.IN_LOBBY]: [UserState.IN_SESSION, UserState.AUTHENTICATED],
        [UserState.IN_SESSION]: [UserState.AUTHENTICATED],
    };

    return validTransitions[from].includes(to);
}

/**
 * Validates whether a lobby state transition is allowed.
 * 
 * @param from - Current lobby state
 * @param to - Desired lobby state
 * @returns true if transition is valid, false otherwise
 */
export function isValidLobbyStateTransition(from: LobbyState, to: LobbyState): boolean {
    const validTransitions: Record<LobbyState, LobbyState[]> = {
        [LobbyState.FORMING]: [LobbyState.READY, LobbyState.DISBANDED],
        [LobbyState.READY]: [LobbyState.ACTIVE, LobbyState.DISBANDED],
        [LobbyState.ACTIVE]: [LobbyState.COMPLETED],
        [LobbyState.COMPLETED]: [], // Terminal state
        [LobbyState.DISBANDED]: [], // Terminal state
    };

    return validTransitions[from].includes(to);
}

/**
 * Validates whether a session state transition is allowed.
 * 
 * @param from - Current session state
 * @param to - Desired session state
 * @returns true if transition is valid, false otherwise
 */
export function isValidSessionStateTransition(from: SessionState, to: SessionState): boolean {
    const validTransitions: Record<SessionState, SessionState[]> = {
        [SessionState.STARTING]: [SessionState.IN_PROGRESS],
        [SessionState.IN_PROGRESS]: [SessionState.PAUSED, SessionState.ENDED],
        [SessionState.PAUSED]: [SessionState.IN_PROGRESS, SessionState.ENDED],
        [SessionState.ENDED]: [], // Terminal state
    };

    return validTransitions[from].includes(to);
}

// ============================================================================
// PERMISSION VALIDATORS
// ============================================================================

/**
 * Determines if a user with a given role can trigger a lobby state transition.
 * 
 * @param role - User's role in the lobby
 * @param from - Current lobby state
 * @param to - Desired lobby state
 * @returns true if user can trigger this transition
 */
export function canTriggerLobbyTransition(
    role: UserRole,
    from: LobbyState,
    to: LobbyState
): boolean {
    // Only DM can start a session (READY -> ACTIVE)
    if (from === LobbyState.READY && to === LobbyState.ACTIVE) {
        return role === UserRole.DM;
    }

    // Only DM can complete a session (ACTIVE -> COMPLETED)
    if (from === LobbyState.ACTIVE && to === LobbyState.COMPLETED) {
        return role === UserRole.DM;
    }

    // DM can disband at any non-terminal state
    if (to === LobbyState.DISBANDED && (from === LobbyState.FORMING || from === LobbyState.READY)) {
        return role === UserRole.DM;
    }

    return false;
}

/**
 * Determines if a user with a given role can trigger a session state transition.
 * 
 * @param role - User's role in the session
 * @param from - Current session state
 * @param to - Desired session state
 * @returns true if user can trigger this transition
 */
export function canTriggerSessionTransition(
    role: UserRole,
    from: SessionState,
    to: SessionState
): boolean {
    // Only DM can pause/resume/end sessions
    return role === UserRole.DM;
}

// ============================================================================
// STATE ENFORCEMENT TYPES
// ============================================================================

/**
 * Represents a user's current state in the system.
 * The discriminated union ensures only valid state combinations exist.
 */
export type UserStateContext =
    | { state: 'UNAUTHENTICATED'; userId: null; lobbyId: null; sessionId: null }
    | { state: 'AUTHENTICATED'; userId: string; lobbyId: null; sessionId: null }
    | { state: 'IN_LOBBY'; userId: string; lobbyId: string; sessionId: null; role: UserRole }
    | { state: 'IN_SESSION'; userId: string; lobbyId: string; sessionId: string; role: UserRole };

/**
 * Represents a lobby's current state.
 * The discriminated union ensures only valid state combinations exist.
 */
export type LobbyStateContext =
    | { state: 'FORMING'; lobbyId: string; memberCount: number; dmId: string; sessionId: null }
    | { state: 'READY'; lobbyId: string; memberCount: number; dmId: string; sessionId: null }
    | { state: 'ACTIVE'; lobbyId: string; memberCount: number; dmId: string; sessionId: string }
    | { state: 'COMPLETED'; lobbyId: string; memberCount: number; dmId: string; sessionId: string }
    | { state: 'DISBANDED'; lobbyId: string; memberCount: number; dmId: string; sessionId: null };

/**
 * Represents a session's current state.
 * Sessions can only exist when lobby is ACTIVE.
 */
export type SessionStateContext =
    | { state: 'STARTING'; sessionId: string; lobbyId: string }
    | { state: 'IN_PROGRESS'; sessionId: string; lobbyId: string }
    | { state: 'PAUSED'; sessionId: string; lobbyId: string }
    | { state: 'ENDED'; sessionId: string; lobbyId: string };

// ============================================================================
// STATE TRANSITION FUNCTIONS
// ============================================================================

/**
 * Attempts to transition a user to a new state.
 * Throws an error if the transition is invalid.
 * 
 * @param current - Current user state context
 * @param newState - Desired user state
 * @param context - Additional context needed for the new state
 * @returns New user state context
 * @throws Error if transition is invalid
 */
export function transitionUserState(
    current: UserStateContext,
    newState: UserState,
    context?: { userId?: string; lobbyId?: string; sessionId?: string; role?: UserRole }
): UserStateContext {
    if (!isValidUserStateTransition(current.state, newState)) {
        throw new Error(
            `Invalid user state transition: ${current.state} -> ${newState}`
        );
    }

    // Type-safe state transitions with required context
    switch (newState) {
        case UserState.UNAUTHENTICATED:
            return { state: UserState.UNAUTHENTICATED, userId: null, lobbyId: null, sessionId: null };

        case UserState.AUTHENTICATED:
            if (!context?.userId) throw new Error('userId required for AUTHENTICATED state');
            return { state: UserState.AUTHENTICATED, userId: context.userId, lobbyId: null, sessionId: null };

        case UserState.IN_LOBBY:
            if (!context?.userId || !context?.lobbyId || !context?.role) {
                throw new Error('userId, lobbyId, and role required for IN_LOBBY state');
            }
            return {
                state: UserState.IN_LOBBY,
                userId: context.userId,
                lobbyId: context.lobbyId,
                sessionId: null,
                role: context.role,
            };

        case UserState.IN_SESSION:
            if (!context?.userId || !context?.lobbyId || !context?.sessionId || !context?.role) {
                throw new Error('userId, lobbyId, sessionId, and role required for IN_SESSION state');
            }
            // Enforce: Cannot enter session unless user is already in the lobby
            if (current.state !== UserState.IN_LOBBY) {
                throw new Error('User must be IN_LOBBY before entering IN_SESSION');
            }
            return {
                state: UserState.IN_SESSION,
                userId: context.userId,
                lobbyId: context.lobbyId,
                sessionId: context.sessionId,
                role: context.role,
            };

        default:
            throw new Error(`Unknown user state: ${newState}`);
    }
}

/**
 * Attempts to transition a lobby to a new state.
 * Throws an error if the transition is invalid or unauthorized.
 * 
 * @param current - Current lobby state context
 * @param newState - Desired lobby state
 * @param triggeredBy - Role of user triggering the transition
 * @param context - Additional context needed for the new state
 * @returns New lobby state context
 * @throws Error if transition is invalid or unauthorized
 */
export function transitionLobbyState(
    current: LobbyStateContext,
    newState: LobbyState,
    triggeredBy: UserRole,
    context?: Partial<LobbyStateContext>
): LobbyStateContext {
    if (!isValidLobbyStateTransition(current.state, newState)) {
        throw new Error(
            `Invalid lobby state transition: ${current.state} -> ${newState}`
        );
    }

    if (!canTriggerLobbyTransition(triggeredBy, current.state, newState)) {
        throw new Error(
            `User with role ${triggeredBy} cannot trigger transition: ${current.state} -> ${newState}`
        );
    }

    const baseContext = {
        lobbyId: current.lobbyId,
        memberCount: context?.memberCount ?? current.memberCount,
        dmId: current.dmId,
    };

    switch (newState) {
        case LobbyState.FORMING:
            return { ...baseContext, state: LobbyState.FORMING, sessionId: null };

        case LobbyState.READY:
            return { ...baseContext, state: LobbyState.READY, sessionId: null };

        case LobbyState.ACTIVE:
            if (!context?.sessionId) throw new Error('sessionId required for ACTIVE state');
            return { ...baseContext, state: LobbyState.ACTIVE, sessionId: context.sessionId };

        case LobbyState.COMPLETED:
            if (!current.sessionId) throw new Error('Cannot complete lobby without active session');
            return { ...baseContext, state: LobbyState.COMPLETED, sessionId: current.sessionId };

        case LobbyState.DISBANDED:
            return { ...baseContext, state: LobbyState.DISBANDED, sessionId: null };

        default:
            throw new Error(`Unknown lobby state: ${newState}`);
    }
}

/**
 * Attempts to transition a session to a new state.
 * Throws an error if the transition is invalid or unauthorized.
 * 
 * @param current - Current session state context
 * @param newState - Desired session state
 * @param triggeredBy - Role of user triggering the transition
 * @returns New session state context
 * @throws Error if transition is invalid or unauthorized
 */
export function transitionSessionState(
    current: SessionStateContext,
    newState: SessionState,
    triggeredBy: UserRole
): SessionStateContext {
    if (!isValidSessionStateTransition(current.state, newState)) {
        throw new Error(
            `Invalid session state transition: ${current.state} -> ${newState}`
        );
    }

    if (!canTriggerSessionTransition(triggeredBy, current.state, newState)) {
        throw new Error(
            `User with role ${triggeredBy} cannot trigger transition: ${current.state} -> ${newState}`
        );
    }

    const baseContext = {
        sessionId: current.sessionId,
        lobbyId: current.lobbyId,
    };

    switch (newState) {
        case SessionState.STARTING:
            return { ...baseContext, state: SessionState.STARTING };

        case SessionState.IN_PROGRESS:
            return { ...baseContext, state: SessionState.IN_PROGRESS };

        case SessionState.PAUSED:
            return { ...baseContext, state: SessionState.PAUSED };

        case SessionState.ENDED:
            return { ...baseContext, state: SessionState.ENDED };

        default:
            throw new Error(`Unknown session state: ${newState}`);
    }
}
