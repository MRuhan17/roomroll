import { io, Socket } from "socket.io-client";
import { useRoomStore } from "@/store/roomStore";
import type { BoardState } from "@/types/room";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

let socket: Socket | null = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(baseURL);

    socket.on("connect", () => {
      useRoomStore.getState().setSocketConnected(true);
    });

    socket.on("disconnect", () => {
      useRoomStore.getState().setSocketConnected(false);
    });

    socket.on("user_joined", (data: { userId: number; displayName: string; message: string }) => {
      const { participants } = useRoomStore.getState();
      if (!participants.find((participant) => participant.id === data.userId)) {
        useRoomStore.getState().setParticipants([
          ...participants,
          { id: data.userId, displayName: data.displayName },
        ]);
      }
    });

    socket.on("user_left", (data: { userId: number; displayName: string; message: string }) => {
      const { participants } = useRoomStore.getState();
      useRoomStore.getState().setParticipants(
        participants.filter((participant) => participant.id !== data.userId)
      );
    });

    socket.on("state_sync", (state: BoardState) => {
      useRoomStore.getState().setBoardState(state);
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
