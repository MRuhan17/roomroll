export interface Room {
  id: number;
  name: string;
  code: string;
  ownerId: number;
  createdAt: string;
}

export interface RoomParticipant {
  id: number;
  displayName: string;
  email?: string;
}

export interface PlayerToken {
  userId: number;
  displayName: string;
  x: number;
  y: number;
  color: string;
}

export interface DiceRoll {
  userId: number;
  displayName: string;
  type: string;
  result: number;
  timestamp: number;
}

export interface RoomNpc {
  id: string;
  name: string;
  description: string;
  hp: number;
  ac: number;
  x: number;
  y: number;
}

export interface BoardState {
  tokens: Record<number, PlayerToken>;
  npcs: RoomNpc[];
  lastAction?: string;
  lastDiceRoll?: DiceRoll;
  updatedAt: number;
}

export interface CreateRoomPayload {
  name: string;
}

export interface JoinRoomPayload {
  code: string;
}

export interface RoomDetails extends Room {
  participants: RoomParticipant[];
}
