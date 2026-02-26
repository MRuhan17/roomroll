export interface Room {
  id: number;
  name: string;
  code: string;
  ownerId: number;
  createdAt: string;
}

export interface CreateRoomPayload {
  name: string;
}

export interface JoinRoomPayload {
  code: string;
}
