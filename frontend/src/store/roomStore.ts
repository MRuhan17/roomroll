import { create } from "zustand";
import type { BoardState, RoomParticipant } from "@/types/room";

interface RoomState {
  activeRoomId: number | null;
  participants: RoomParticipant[];
  isSocketConnected: boolean;
  boardState: BoardState | null;
  setActiveRoomId: (id: number | null) => void;
  setParticipants: (participants: RoomParticipant[]) => void;
  setSocketConnected: (connected: boolean) => void;
  setBoardState: (state: BoardState) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  activeRoomId: null,
  participants: [],
  isSocketConnected: false,
  boardState: null,
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setParticipants: (participants) => set({ participants }),
  setSocketConnected: (connected) => set({ isSocketConnected: connected }),
  setBoardState: (state) => set({ boardState: state }),
}));
