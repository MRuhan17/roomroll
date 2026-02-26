import { create } from "zustand";

interface RoomState {
  activeRoomId: number | null;
  participants: string[];
  isSocketConnected: boolean;
  setActiveRoomId: (id: number | null) => void;
  setParticipants: (participants: string[]) => void;
  setSocketConnected: (connected: boolean) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  activeRoomId: null,
  participants: [],
  isSocketConnected: false,
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setParticipants: (participants) => set({ participants }),
  setSocketConnected: (connected) => set({ isSocketConnected: connected }),
}));
