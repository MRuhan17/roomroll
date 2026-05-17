import { create } from 'zustand';
import { api } from '../services/api';
import { WorldData, LoreEntry, Faction, Discovery, WorldEvent } from '../types/world';

interface WorldState {
    lore: LoreEntry[];
    factions: Faction[];
    discoveries: Discovery[];
    worldEvents: WorldEvent[];
    isLoading: boolean;
    error: string | null;
    fetchWorldData: (campaignId: number) => Promise<void>;
    discoverEntity: (campaignId: number, type: 'lore' | 'faction', id: number) => Promise<void>;
    addDiscoveryEvent: (discovery: Discovery, entityType: string, entityId: number) => void;
    addLoreDiscoveredEvent: (lore: LoreEntry) => void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
    lore: [],
    factions: [],
    discoveries: [],
    worldEvents: [],
    isLoading: false,
    error: null,

    fetchWorldData: async (campaignId: number) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get<WorldData>(`/campaigns/${campaignId}/world`);
            set({
                lore: response.data.lore,
                factions: response.data.factions,
                discoveries: response.data.discoveries,
                worldEvents: response.data.worldEvents,
                isLoading: false,
            });
        } catch (error: any) {
            set({ error: error.response?.data?.message || 'Failed to fetch world data', isLoading: false });
        }
    },

    discoverEntity: async (campaignId: number, type: 'lore' | 'faction', id: number) => {
        try {
            await api.post(`/campaigns/${campaignId}/world/discover`, { entity_type: type, entity_id: id });
        } catch (error) {
            console.error('Failed to discover entity', error);
        }
    },

    addDiscoveryEvent: (discovery: Discovery, entityType: string, entityId: number) => {
        set((state) => {
            const discoveries = [discovery, ...state.discoveries];
            let lore = [...state.lore];
            let factions = [...state.factions];

            if (entityType === 'lore') {
                lore = lore.map(l => l.id === entityId ? { ...l, is_discovered: true } : l);
            } else if (entityType === 'faction') {
                factions = factions.map(f => f.id === entityId ? { ...f, is_discovered: true } : f);
            }

            return { discoveries, lore, factions };
        });
    },

    addLoreDiscoveredEvent: (newLore: LoreEntry) => {
        set((state) => ({
            lore: [...state.lore, newLore]
        }));
    }
}));
