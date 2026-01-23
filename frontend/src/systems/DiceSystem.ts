/**
 * Dice System (Server-Authoritative Simulation)
 * 
 * This system simulates a server-side dice roller.
 * In a production environment, this logic would reside on the backend
 * to prevent client-side manipulation.
 */

export interface RollRequest {
    userId: string;
    userName: string;
    notation: string; // e.g., "1d20", "2d6+4"
}

export interface RollResult {
    id: string;
    userId: string;
    userName: string;
    notation: string;
    total: number;
    rolls: number[];
    modifier: number;
    timestamp: number;
}

/**
 * Validates the dice notation.
 * Supports simple NdX+M format (e.g., 2d6+3, 1d20, 3d8-1).
 */
const DICE_REGEX = /^(\d+)d(\d+)([+-]\d+)?$/;

export class DiceSystem {
    /**
     * Simulates a server-side roll request.
     * This is the "single source of truth" for the roll.
     */
    static processRoll(request: RollRequest): RollResult {
        // 1. Validate Notation
        const match = request.notation.match(DICE_REGEX);
        if (!match) {
            throw new Error(`Invalid dice notation: ${request.notation}. Use format NdX+M (e.g., 1d20+5).`);
        }

        const count = parseInt(match[1], 10);
        const sides = parseInt(match[2], 10);
        const modifier = match[3] ? parseInt(match[3], 10) : 0;

        // Constraint Limits (Safety)
        if (count > 20) throw new Error("Too many dice (max 20)");
        if (sides > 100) throw new Error("Too many sides (max 100)");

        // 2. Perform RNG (Server-Authoritative)
        const rolls: number[] = [];
        let sum = 0;

        for (let i = 0; i < count; i++) {
            // Secure random number generation (simulated)
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            sum += roll;
        }

        const total = sum + modifier;

        // 3. Construct Result
        return {
            id: `roll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: request.userId,
            userName: request.userName,
            notation: request.notation,
            total,
            rolls,
            modifier,
            timestamp: Date.now(),
        };
    }

    /**
     * Broadcasts the roll to all connected clients.
     * (Simulated by returning the result directly for now)
     */
    static broadcastRoll(result: RollResult): void {
        console.log(`[DiceSystem] Broadcast: ${result.userName} rolled ${result.total} (${result.notation})`);
        // Real backend would emit WebSocket event here:
        // io.to(lobbyId).emit('ROLL_RESULT', result);
    }
}
