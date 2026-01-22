/**
 * Role-Based Permissions System
 * 
 * Enforces DM vs Player permissions to ensure only the DM can perform privileged actions.
 * 
 * Guarded Actions:
 * - Start Session (DM only)
 * - Pause Session (DM only)
 * - End Session (DM only)
 * - Kick Player (DM only)
 * - Ban Player (DM only)
 * - Upload Map (DM only)
 * - Modify Lobby Settings (DM only)
 * 
 * Success Criteria:
 * Non-DM users cannot trigger DM-only actions even if they manipulate the UI.
 */

import { UserRole, type UserStateContext } from '../models/GameState';

/**
 * Enum of all privileged actions in the system.
 * These actions require specific role permissions.
 */
export const PrivilegedAction = {
    // Session Management
    START_SESSION: 'START_SESSION',
    PAUSE_SESSION: 'PAUSE_SESSION',
    RESUME_SESSION: 'RESUME_SESSION',
    END_SESSION: 'END_SESSION',

    // Player Management
    KICK_PLAYER: 'KICK_PLAYER',
    BAN_PLAYER: 'BAN_PLAYER',
    UNBAN_PLAYER: 'UNBAN_PLAYER',
    PROMOTE_TO_DM: 'PROMOTE_TO_DM',

    // Content Management
    UPLOAD_MAP: 'UPLOAD_MAP',
    DELETE_MAP: 'DELETE_MAP',
    MODIFY_MAP: 'MODIFY_MAP',

    // Lobby Management
    MODIFY_LOBBY_SETTINGS: 'MODIFY_LOBBY_SETTINGS',
    DELETE_LOBBY: 'DELETE_LOBBY',
    TRANSFER_OWNERSHIP: 'TRANSFER_OWNERSHIP',
} as const;

export type PrivilegedAction = typeof PrivilegedAction[keyof typeof PrivilegedAction];

/**
 * Maps each privileged action to the roles that can perform it.
 */
const ACTION_ROLE_MAP: Record<PrivilegedAction, UserRole[]> = {
    // Session Management - DM only
    [PrivilegedAction.START_SESSION]: [UserRole.DM],
    [PrivilegedAction.PAUSE_SESSION]: [UserRole.DM],
    [PrivilegedAction.RESUME_SESSION]: [UserRole.DM],
    [PrivilegedAction.END_SESSION]: [UserRole.DM],

    // Player Management - DM only
    [PrivilegedAction.KICK_PLAYER]: [UserRole.DM],
    [PrivilegedAction.BAN_PLAYER]: [UserRole.DM],
    [PrivilegedAction.UNBAN_PLAYER]: [UserRole.DM],
    [PrivilegedAction.PROMOTE_TO_DM]: [UserRole.DM],

    // Content Management - DM only
    [PrivilegedAction.UPLOAD_MAP]: [UserRole.DM],
    [PrivilegedAction.DELETE_MAP]: [UserRole.DM],
    [PrivilegedAction.MODIFY_MAP]: [UserRole.DM],

    // Lobby Management - DM only
    [PrivilegedAction.MODIFY_LOBBY_SETTINGS]: [UserRole.DM],
    [PrivilegedAction.DELETE_LOBBY]: [UserRole.DM],
    [PrivilegedAction.TRANSFER_OWNERSHIP]: [UserRole.DM],
};

/**
 * Permission check result with detailed information.
 */
export interface PermissionCheckResult {
    allowed: boolean;
    reason?: string;
    requiredRole?: UserRole;
    currentRole?: UserRole;
}

/**
 * Checks if a user has permission to perform a specific action.
 * 
 * @param userState - Current user state context
 * @param action - The privileged action to check
 * @returns Permission check result with detailed information
 */
export function canPerformAction(
    userState: UserStateContext,
    action: PrivilegedAction
): PermissionCheckResult {
    // Permission Check 1: User must be in a lobby or session to have a role
    if (userState.state !== 'IN_LOBBY' && userState.state !== 'IN_SESSION') {
        return {
            allowed: false,
            reason: 'User must be in a lobby or session to perform this action',
        };
    }

    // Permission Check 2: User must have a role assigned
    if (!userState.role) {
        return {
            allowed: false,
            reason: 'User does not have a role assigned',
        };
    }

    // Permission Check 3: Check if user's role is allowed for this action
    const allowedRoles = ACTION_ROLE_MAP[action];
    const hasPermission = allowedRoles.includes(userState.role);

    if (!hasPermission) {
        return {
            allowed: false,
            reason: `Action '${action}' requires role: ${allowedRoles.join(' or ')}`,
            requiredRole: allowedRoles[0],
            currentRole: userState.role,
        };
    }

    // Permission granted
    return {
        allowed: true,
    };
}

/**
 * Checks if a user is a DM.
 * 
 * @param userState - Current user state context
 * @returns true if user is a DM, false otherwise
 */
export function isDM(userState: UserStateContext): boolean {
    return (userState.state === 'IN_LOBBY' || userState.state === 'IN_SESSION')
        && userState.role === UserRole.DM;
}

/**
 * Checks if a user is a Player.
 * 
 * @param userState - Current user state context
 * @returns true if user is a Player, false otherwise
 */
export function isPlayer(userState: UserStateContext): boolean {
    return (userState.state === 'IN_LOBBY' || userState.state === 'IN_SESSION')
        && userState.role === UserRole.PLAYER;
}

/**
 * Asserts that a user has permission to perform an action.
 * Throws an error if permission is denied.
 * 
 * @param userState - Current user state context
 * @param action - The privileged action to check
 * @throws Error if permission is denied
 */
export function assertCanPerformAction(
    userState: UserStateContext,
    action: PrivilegedAction
): void {
    const result = canPerformAction(userState, action);

    if (!result.allowed) {
        throw new PermissionDeniedError(
            action,
            result.reason || 'Permission denied',
            result.currentRole,
            result.requiredRole
        );
    }
}

/**
 * Custom error class for permission denied errors.
 */
export class PermissionDeniedError extends Error {
    action: PrivilegedAction;
    reason: string;
    currentRole?: UserRole;
    requiredRole?: UserRole;

    constructor(
        action: PrivilegedAction,
        reason: string,
        currentRole?: UserRole,
        requiredRole?: UserRole
    ) {
        super(`Permission denied for action '${action}': ${reason}`);
        this.name = 'PermissionDeniedError';
        this.action = action;
        this.reason = reason;
        this.currentRole = currentRole;
        this.requiredRole = requiredRole;
    }
}

/**
 * Guards a function to ensure the user has permission before execution.
 * Returns a wrapped function that checks permissions before calling the original.
 * 
 * @param action - The privileged action this function performs
 * @param fn - The function to guard
 * @returns A wrapped function that checks permissions
 */
export function guardAction<T extends any[], R>(
    action: PrivilegedAction,
    fn: (userState: UserStateContext, ...args: T) => R
): (userState: UserStateContext, ...args: T) => R {
    return (userState: UserStateContext, ...args: T): R => {
        // Permission check before execution
        assertCanPerformAction(userState, action);

        // Permission granted - execute the function
        return fn(userState, ...args);
    };
}

/**
 * Session management actions (DM only)
 */

/**
 * Starts a session. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 */
export const startSession = guardAction(
    PrivilegedAction.START_SESSION,
    (userState: UserStateContext, lobbyId: string): { sessionId: string } => {
        // Role Check: Only DM can start sessions
        // This check is enforced by guardAction wrapper

        // TODO: Replace with actual backend call
        const sessionId = `session-${Date.now()}`;
        console.log(`[DM Action] Session started by DM ${userState.userId}: ${sessionId}`);

        return { sessionId };
    }
);

/**
 * Pauses a session. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 */
export const pauseSession = guardAction(
    PrivilegedAction.PAUSE_SESSION,
    (userState: UserStateContext, sessionId: string): void => {
        // Role Check: Only DM can pause sessions
        // This check is enforced by guardAction wrapper

        // TODO: Replace with actual backend call
        console.log(`[DM Action] Session paused by DM ${userState.userId}: ${sessionId}`);
    }
);

/**
 * Resumes a paused session. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 */
export const resumeSession = guardAction(
    PrivilegedAction.RESUME_SESSION,
    (userState: UserStateContext, sessionId: string): void => {
        // Role Check: Only DM can resume sessions
        // This check is enforced by guardAction wrapper

        // TODO: Replace with actual backend call
        console.log(`[DM Action] Session resumed by DM ${userState.userId}: ${sessionId}`);
    }
);

/**
 * Ends a session. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 */
export const endSession = guardAction(
    PrivilegedAction.END_SESSION,
    (userState: UserStateContext, sessionId: string): void => {
        // Role Check: Only DM can end sessions
        // This check is enforced by guardAction wrapper

        // TODO: Replace with actual backend call
        console.log(`[DM Action] Session ended by DM ${userState.userId}: ${sessionId}`);
    }
);

/**
 * Player management actions (DM only)
 */

/**
 * Kicks a player from the lobby. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 * 
 * Behavioral Difference: Kick is temporary and lobby-specific.
 * Player can rejoin this lobby later (if kick is cleared) and can join other lobbies by the same DM.
 */
export const kickPlayer = guardAction(
    PrivilegedAction.KICK_PLAYER,
    (userState: UserStateContext, lobbyId: string, playerId: string, reason?: string): void => {
        // Role Check: Only DM can kick players
        // This check is enforced by guardAction wrapper

        // Import kick/ban system dynamically to avoid circular dependencies
        import('../moderation/KickBanSystem').then(({ kickPlayerFromLobby }) => {
            kickPlayerFromLobby(playerId, lobbyId, userState.userId!, reason);
        });

        console.log(`[DM Action] Player kicked by DM ${userState.userId}: ${playerId}`, reason);
    }
);

/**
 * Bans a player from all lobbies hosted by this DM. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 * 
 * Behavioral Difference: Ban is permanent and DM-scoped.
 * Player cannot join ANY lobby hosted by this DM (current or future).
 */
export const banPlayer = guardAction(
    PrivilegedAction.BAN_PLAYER,
    (userState: UserStateContext, lobbyId: string, playerId: string, reason?: string): void => {
        // Role Check: Only DM can ban players
        // This check is enforced by guardAction wrapper

        // Import kick/ban system dynamically to avoid circular dependencies
        import('../moderation/KickBanSystem').then(({ banPlayerByDM }) => {
            banPlayerByDM(playerId, userState.userId!, lobbyId, reason);
        });

        console.log(`[DM Action] Player banned by DM ${userState.userId}: ${playerId}`, reason);
    }
);

/**
 * Content management actions (DM only)
 */

/**
 * Uploads a map to the session. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 */
export const uploadMap = guardAction(
    PrivilegedAction.UPLOAD_MAP,
    (userState: UserStateContext, mapFile: File): { mapId: string } => {
        // Role Check: Only DM can upload maps
        // This check is enforced by guardAction wrapper

        // TODO: Replace with actual backend call
        const mapId = `map-${Date.now()}`;
        console.log(`[DM Action] Map uploaded by DM ${userState.userId}: ${mapFile.name}`);

        return { mapId };
    }
);

/**
 * Lobby management actions (DM only)
 */

/**
 * Modifies lobby settings. DM only.
 * Success Criteria: Non-DM users cannot trigger this action.
 */
export const modifyLobbySettings = guardAction(
    PrivilegedAction.MODIFY_LOBBY_SETTINGS,
    (userState: UserStateContext, settings: Record<string, any>): void => {
        // Role Check: Only DM can modify lobby settings
        // This check is enforced by guardAction wrapper

        // TODO: Replace with actual backend call
        console.log(`[DM Action] Lobby settings modified by DM ${userState.userId}:`, settings);
    }
);
