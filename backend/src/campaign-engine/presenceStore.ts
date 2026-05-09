export interface PresenceUpdate {
    userId: number;
    onlineUserIds: number[];
    changed: boolean;
}

class PresenceStore {
    private campaignPresence = new Map<number, Map<number, Set<string>>>();

    join(campaignId: number, userId: number, socketId: string): PresenceUpdate {
        const campaignMap = this.campaignPresence.get(campaignId) ?? new Map<number, Set<string>>();
        const userSockets = campaignMap.get(userId) ?? new Set<string>();
        const wasOnline = userSockets.size > 0;
        userSockets.add(socketId);
        campaignMap.set(userId, userSockets);
        this.campaignPresence.set(campaignId, campaignMap);
        return {
            userId,
            onlineUserIds: Array.from(campaignMap.keys()),
            changed: !wasOnline
        };
    }

    leave(campaignId: number, userId: number, socketId: string): PresenceUpdate {
        const campaignMap = this.campaignPresence.get(campaignId) ?? new Map<number, Set<string>>();
        const userSockets = campaignMap.get(userId);
        let changed = false;
        if (userSockets) {
            userSockets.delete(socketId);
            if (userSockets.size === 0) {
                campaignMap.delete(userId);
                changed = true;
            } else {
                campaignMap.set(userId, userSockets);
            }
        }
        if (campaignMap.size === 0) {
            this.campaignPresence.delete(campaignId);
        } else {
            this.campaignPresence.set(campaignId, campaignMap);
        }
        return {
            userId,
            onlineUserIds: Array.from(campaignMap.keys()),
            changed
        };
    }

    listOnlineUsers(campaignId: number): number[] {
        const campaignMap = this.campaignPresence.get(campaignId);
        if (!campaignMap) {
            return [];
        }
        return Array.from(campaignMap.keys());
    }
}

export const presenceStore = new PresenceStore();
