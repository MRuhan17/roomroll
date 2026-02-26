import { api } from "@/services/api";
import type { CreateRoomPayload, JoinRoomPayload, Room } from "@/types/room";

export async function fetchRooms() {
  const { data } = await api.get<Room[]>("/api/rooms");
  return data;
}

export async function createRoom(payload: CreateRoomPayload) {
  const { data } = await api.post<Room>("/api/rooms", payload);
  return data;
}

export async function joinRoom(payload: JoinRoomPayload) {
  const { data } = await api.post<Room>("/api/rooms/join", payload);
  return data;
}
