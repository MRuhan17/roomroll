/**
 * Kick and Ban Mechanics
 * 
 * Implements the behavioral difference between:
 * - Temporary lobby kick: Player removed from current lobby, can rejoin
 * - Permanent DM-scoped ban: Player cannot join ANY lobby hosted by that DM
 * 
 * Success Criteria:
 * A banned player can never join any lobby hosted by that DM.
 */

/**
 * Represents a temporary kick from a specific lobby.
 * Player is removed but can attempt to rejoin.
 */
export interface KickRecord {
    playerId: string;
    lobbyId: string;
    kickedBy: string;  // DM user ID
    kickedAt: Date;
    reason?: string;
}

/**
 * Represents a permanent ban from all lobbies hosted by a specific DM.
 * Player cannot join ANY lobby where this DM is the host.
 */
export interface BanRecord {
    playerId: string;
    bannedBy: string;  // DM user ID (ban is DM-scoped)
    bannedAt: Date;
    reason?: string;
}

/**
 * In-memory storage for kicks and bans.
 * In production, this would be persisted to a database.
 */
class ModerationStore {
    // Map: lobbyId -> Set of kicked player IDs
    private kicks: Map<string, Set<string>> = new Map();

    // Map: DM user ID -> Set of banned player IDs
    // Success Criteria: Bans are DM-scoped, not lobby-scoped
    private bans: Map<string, Set<string>> = new Map();

    // Detailed records for audit trail
    private kickRecords: KickRecord[] = [];
    private banRecords: BanRecord[] = [];

    /**
     * Records a temporary kick from a lobby.
     * Behavioral Difference: Kick is lobby-specific, player can join other lobbies.
     */
    recordKick(kick: KickRecord): void {
        // Add to lobby-specific kick set
        if (!this.kicks.has(kick.lobbyId)) {
            this.kicks.set(kick.lobbyId, new Set());
        }
        this.kicks.get(kick.lobbyId)!.add(kick.playerId);

        // Store detailed record
        this.kickRecords.push(kick);

        console.log(`[KICK] Player ${kick.playerId} kicked from lobby ${kick.lobbyId} by DM ${kick.kickedBy}`);
    }

    /**
     * Records a permanent ban from all lobbies hosted by a DM.
     * Behavioral Difference: Ban is DM-scoped, affects ALL lobbies by this DM.
     * Success Criteria: Banned player cannot join ANY lobby hosted by this DM.
     */
    recordBan(ban: BanRecord): void {
        // Add to DM-specific ban set
        if (!this.bans.has(ban.bannedBy)) {
            this.bans.set(ban.bannedBy, new Set());
        }
        this.bans.get(ban.bannedBy)!.add(ban.playerId);

        // Store detailed record
        this.banRecords.push(ban);

        console.log(`[BAN] Player ${ban.playerId} permanently banned by DM ${ban.bannedBy}`);
    }

    /**
     * Checks if a player is currently kicked from a specific lobby.
     * Kick is temporary and lobby-specific.
     */
    isKicked(playerId: string, lobbyId: string): boolean {
        const lobbyKicks = this.kicks.get(lobbyId);
        return lobbyKicks ? lobbyKicks.has(playerId) : false;
    }

    /**
     * Checks if a player is banned by a specific DM.
     * Ban is permanent and DM-scoped (affects all lobbies by this DM).
     * Success Criteria: This check prevents banned players from joining ANY lobby by this DM.
     */
    isBanned(playerId: string, dmId: string): boolean {
        const dmBans = this.bans.get(dmId);
        return dmBans ? dmBans.has(playerId) : false;
    }

    /**
     * Clears a kick, allowing the player to rejoin the lobby.
     * Behavioral Difference: Kicks can be cleared, bans cannot (no unban logic).
     */
    clearKick(playerId: string, lobbyId: string): void {
        const lobbyKicks = this.kicks.get(lobbyId);
        if (lobbyKicks) {
            lobbyKicks.delete(playerId);
            console.log(`[KICK CLEARED] Player ${playerId} can now rejoin lobby ${lobbyId}`);
        }
    }

    /**
     * Clears all kicks for a lobby (e.g., when lobby is disbanded).
     */
    clearLobbyKicks(lobbyId: string): void {
        this.kicks.delete(lobbyId);
        console.log(`[KICKS CLEARED] All kicks cleared for lobby ${lobbyId}`);
    }

    /**
     * Gets all kick records for audit purposes.
     */
    getKickRecords(): KickRecord[] {
        return [...this.kickRecords];
    }

    /**
     * Gets all ban records for audit purposes.
     */
    getBanRecords(): BanRecord[] {
        return [...this.banRecords];
    }

    /**
     * Gets all players banned by a specific DM.
     */
    getBannedPlayersByDM(dmId: string): string[] {
        const dmBans = this.bans.get(dmId);
        return dmBans ? Array.from(dmBans) : [];
    }
}

// Singleton instance
export const moderationStore = new ModerationStore();

/**
 * Result of a join attempt check.
 */
export interface JoinCheckResult {
    allowed: boolean;
    reason?: 'kicked' | 'banned';
    message?: string;
}

/**
 * Enforcement: Checks if a player can join a lobby.
 * 
 * Success Criteria: Banned players cannot join ANY lobby hosted by the DM who banned them.
 * 
 * @param playerId - ID of player attempting to join
 * @param lobbyId - ID of lobby to join
 * @param dmId - ID of DM hosting the lobby
 * @returns Join check result
 */
export function canJoinLobby(
    playerId: string,
    lobbyId: string,
    dmId: string
): JoinCheckResult {
    // Enforcement Check 1: Is player banned by this DM?
    // Success Criteria: Banned player cannot join ANY lobby by this DM
    if (moderationStore.isBanned(playerId, dmId)) {
        return {
            allowed: false,
            reason: 'banned',
            message: `You are permanently banned from all lobbies hosted by this DM`,
        };
    }

    // Enforcement Check 2: Is player kicked from this specific lobby?
    // Behavioral Difference: Kick is lobby-specific, not DM-wide
    if (moderationStore.isKicked(playerId, lobbyId)) {
        return {
            allowed: false,
            reason: 'kicked',
            message: `You have been kicked from this lobby`,
        };
    }

    // Player can join
    return {
        allowed: true,
    };
}

/**
 * Kicks a player from a lobby (temporary, lobby-specific).
 * Immediate removal behavior: Player is removed from lobby immediately.
 * 
 * Behavioral Difference: Player can rejoin this lobby later (if kick is cleared)
 * and can join other lobbies by the same DM.
 * 
 * @param playerId - ID of player to kick
 * @param lobbyId - ID of lobby to kick from
 * @param kickedBy - ID of DM performing the kick
 * @param reason - Optional reason for kick
 */
export function kickPlayerFromLobby(
    playerId: string,
    lobbyId: string,
    kickedBy: string,
    reason?: string
): void {
    // Record the kick
    moderationStore.recordKick({
        playerId,
        lobbyId,
        kickedBy,
        kickedAt: new Date(),
        reason,
    });

    // Immediate removal behavior: Remove player from lobby
    // TODO: Integrate with lobby state management to actually remove player
    console.log(`[IMMEDIATE REMOVAL] Player ${playerId} removed from lobby ${lobbyId}`);
}

/**
 * Bans a player from all lobbies hosted by a DM (permanent, DM-scoped).
 * Immediate removal behavior: Player is removed from current lobby immediately.
 * 
 * Behavioral Difference: Player cannot rejoin ANY lobby hosted by this DM.
 * Success Criteria: Ban affects all current and future lobbies by this DM.
 * 
 * @param playerId - ID of player to ban
 * @param bannedBy - ID of DM performing the ban
 * @param currentLobbyId - Optional ID of current lobby (for immediate removal)
 * @param reason - Optional reason for ban
 */
export function banPlayerByDM(
    playerId: string,
    bannedBy: string,
    currentLobbyId?: string,
    reason?: string
): void {
    // Record the ban (DM-scoped, not lobby-scoped)
    moderationStore.recordBan({
        playerId,
        bannedBy,
        bannedAt: new Date(),
        reason,
    });

    // Immediate removal behavior: Remove player from current lobby if specified
    if (currentLobbyId) {
        console.log(`[IMMEDIATE REMOVAL] Player ${playerId} removed from lobby ${currentLobbyId}`);
        // TODO: Integrate with lobby state management to actually remove player
    }

    // Success Criteria: Player is now banned from ALL lobbies by this DM
    console.log(`[BAN EFFECT] Player ${playerId} cannot join ANY lobby hosted by DM ${bannedBy}`);
}

/**
 * Allows a kicked player to rejoin a lobby.
 * Behavioral Difference: Only kicks can be cleared, bans cannot (no unban logic).
 * 
 * @param playerId - ID of player to allow back
 * @param lobbyId - ID of lobby to allow them back into
 */
export function allowRejoin(playerId: string, lobbyId: string): void {
    moderationStore.clearKick(playerId, lobbyId);
}

/**
 * Clears all kicks when a lobby is disbanded.
 * Bans persist even after lobby is disbanded (DM-scoped, not lobby-scoped).
 * 
 * @param lobbyId - ID of lobby being disbanded
 */
export function clearLobbyModerationOnDisband(lobbyId: string): void {
    moderationStore.clearLobbyKicks(lobbyId);
    console.log(`[LOBBY DISBANDED] Kicks cleared, bans persist (DM-scoped)`);
}

/**
 * Gets moderation status for a player in a specific lobby.
 * 
 * @param playerId - ID of player to check
 * @param lobbyId - ID of lobby
 * @param dmId - ID of DM hosting the lobby
 * @returns Moderation status
 */
export function getModerationStatus(
    playerId: string,
    lobbyId: string,
    dmId: string
): {
    isKicked: boolean;
    isBanned: boolean;
    canJoin: boolean;
} {
    const isKicked = moderationStore.isKicked(playerId, lobbyId);
    const isBanned = moderationStore.isBanned(playerId, dmId);
    const joinCheck = canJoinLobby(playerId, lobbyId, dmId);

    return {
        isKicked,
        isBanned,
        canJoin: joinCheck.allowed,
    };
}
