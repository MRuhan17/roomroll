# RoomRoll Realtime Documentation

This document outlines the Socket.IO realtime infrastructure for the RoomRoll project. The system currently implements two distinct Socket.IO modules: the Campaign Engine (handling complex campaign state with authentication) and the Simple Realtime Room (a lighter, unauthenticated room state implementation).

---

## 1. Campaign Engine Socket (`src/socket/`)

The primary Socket.IO implementation handles authenticated campaign rooms, dice rolls, token movements, AI narration, and DM controls.

### Connection Lifecycle

1. **Connection & Authentication**: 
   - The client connects to the Socket.IO server.
   - A middleware intercepts the connection and checks for an authentication token (either in `socket.handshake.auth.token` or the `Authorization` header).
   - If the token is missing or invalid, the connection is rejected with an `Unauthorized` error.
   - If valid, the authenticated user object is stored in `socket.data.user`.

2. **Joining a Campaign**:
   - The client emits a `JOIN_CAMPAIGN` event with the campaign ID.
   - The server verifies the user is a member of the campaign.
   - The socket joins a specific room formatted as `campaign:<campaignId>`.
   - The server adds the user to the `presenceStore`.
   - The server emits `PLAYER_JOINED` to other users in the room and sends the current `CAMPAIGN_STATE` back to the joining user.

3. **Disconnection / Leaving**:
   - The client can explicitly emit `LEAVE_CAMPAIGN`, or the socket can naturally `disconnect`.
   - The server removes the user from the `presenceStore` and leaves the campaign room.
   - The server broadcasts `PLAYER_LEFT` to the remaining users in the room.

### Client-to-Server Events

| Event Name | Payload Structure | Description |
| :--- | :--- | :--- |
| `JOIN_CAMPAIGN` | `{ campaignId?: number \| string }` | Joins a campaign room. Decodes ID, verifies membership, and syncs initial state. |
| `LEAVE_CAMPAIGN` | None | Leaves the current campaign room. |
| `PLAYER_TYPING` | `{ isTyping?: boolean }` | Indicates whether the player is currently typing. |
| `DICE_ROLLED` | `{ diceType: string, context?: string, ... }` | Rolls dice, potentially triggering AI narration and memory moments for critical rolls. |
| `TOKEN_MOVED` | `{ tokenId?: number, position?: { x: number, y: number, snapped?: boolean } }` | Moves a token on the map. |
| `TOKEN_CREATED` | `{ mapId?: number, tokenType?: 'player'\|'enemy'\|'npc'\|'boss', label?: string, hpCurrent?: number, hpMax?: number, position?: { x: number, y: number, snapped?: boolean }, isHidden?: boolean }` | Creates a new token. |
| `TOKEN_UPDATED` | `{ tokenId?: number, hpCurrent?: number, hpMax?: number, label?: string, isHidden?: boolean }` | Updates an existing token. |
| `TOKEN_DELETED` | `{ tokenId?: number }` | Deletes a token. |
| `MAP_VIEWPORT` | `{ x?: number, y?: number, zoom?: number }` | Updates the client's current map viewport. |
| `COMBAT_TURN` | `{ tokenId?: number, round?: number }` | Advances or sets the combat turn. |
| `MAP_PING` | `{ x?: number, y?: number }` | Pings a location on the map for other users to see. |
| `MAP_REVEALED` | `{ mapId?: number, revealState?: Record<string, unknown> }` | (DM Only) Updates the fog of war reveal state. |
| `NEW_NARRATION` | `{ text?: string }` | (DM Only) Adds a new narration log entry. |
| `REQUEST_AI_NARRATION` | `{ playerAction?: string, tone?: string }` | (DM Only) Requests AI-generated narration based on player actions. |
| `WORLD_EVENT` | `{ title?: string, description?: string, status?: string }` | (DM Only) Creates a new world event. |
| `REQUEST_AI_WORLD_EVENT`| None | (DM Only) Requests an AI-generated world event. |
| `UPDATE_NPC_RELATIONSHIP`| `{ npcName?: string, context?: string }` | (DM Only) Updates the relationship status of an NPC. |
| `QUEST_UPDATED` | `{ questId?: number, title?: string, description?: string, status?: string, progress?: Record<string, unknown> }` | (DM Only) Creates or updates a quest. |
| `SESSION_STARTED` | None | (DM Only) Starts a new game session. |
| `SESSION_ENDED` | `{ summary?: string }` | (DM Only) Ends the current game session. |

### Server-to-Client Events

| Event Name | Payload Structure | Description |
| :--- | :--- | :--- |
| `ERROR` | `{ message: string }` | Sent when an error occurs or authorization fails (e.g., missing DM role). |
| `PLAYER_JOINED` | `{ userId: number, onlineUserIds: number[] }` | Broadcast when a user joins the campaign room. |
| `PLAYER_LEFT` | `{ userId: number, onlineUserIds: number[] }` | Broadcast when a user leaves the campaign room. |
| `CAMPAIGN_STATE` | `{ snapshot: any, onlineUserIds: number[] }` | Full campaign state sync sent upon joining or after major state changes. |
| `PLAYER_TYPING` | `{ userId: number, isTyping: boolean }` | Broadcast when a user starts or stops typing. |
| `DICE_ROLLED` | `{ userId: number, roll: any, classification: any, narration: string }` | Broadcast when a user rolls dice. Includes results and optional AI narration. |
| `NEW_MEMORY_MOMENT` | `{ memory: any }` | Broadcast when a legendary or critical dice roll generates a permanent campaign memory. |
| `TOKEN_MOVED` | `{ userId: number, token: any }` | Broadcast when a token is moved. |
| `TOKEN_CREATED` | `{ userId: number, token: any }` | Broadcast when a token is created. |
| `TOKEN_UPDATED` | `{ userId: number, token: any }` | Broadcast when a token is updated. |
| `TOKEN_DELETED` | `{ userId: number, tokenId: number }` | Broadcast when a token is deleted. |
| `MAP_VIEWPORT` | `{ userId: number, x: number, y: number, zoom: number }` | Broadcast when a user updates their viewport. |
| `COMBAT_TURN` | `{ userId: number, tokenId: number, round: number }` | Broadcast when the combat turn changes. |
| `MAP_REVEALED` | `{ userId: number, map: any }` | Broadcast when the DM reveals parts of the map. |
| `NEW_NARRATION` | `{ userId: number, text: string, ai?: boolean }` | Broadcast when a new narration is added (manual or AI). |
| `WORLD_EVENT` | `{ userId: number, event: any }` | Broadcast when a world event is created. |
| `QUEST_UPDATED` | `{ userId: number, quest: any }` | Broadcast when a quest is updated. |
| `SESSION_STARTED` | `{ userId: number, state: any }` | Broadcast when a session starts. |
| `SESSION_ENDED` | `{ userId: number, state: any }` | Broadcast when a session ends. |
| `MAP_PING` | `{ userId: number, x: number, y: number }` | Broadcast when a user pings the map. |

---

## 2. Simple Realtime Room (`src/realtime/`)

An alternative, lightweight room implementation managing basic token positioning and unauthenticated dice rolls.

### Connection Lifecycle

1. **Connection**: Client connects without authentication middleware.
2. **Joining a Room**: 
   - Client emits `join_room` with `roomId`, `userId`, and `displayName`.
   - Server joins the socket to the `roomId`, registers the user in a local `socketUsers` map, and generates an initial token if the user doesn't have one.
   - Server emits `user_joined` to the room and sends the current `state_sync` to the joining user.
3. **Disconnection**:
   - When the socket disconnects, the server removes the user from `socketUsers` and broadcasts a `user_left` event.

### Client-to-Server Events

| Event Name | Payload Structure | Description |
| :--- | :--- | :--- |
| `join_room` | `{ roomId: string, userId: number, displayName: string }` | Joins a room, registers the user, and fetches/creates their token. |
| `update_token` | `{ x: number, y: number }` | Updates the user's token position on the grid. |
| `roll_dice` | `{ type: string }` | Rolls a specified die (e.g., 'd20', 'd6'). |

### Server-to-Client Events

| Event Name | Payload Structure | Description |
| :--- | :--- | :--- |
| `user_joined` | `{ userId: number, displayName: string, message: string }` | Broadcast when a user joins the room. |
| `user_left` | `{ userId: number, displayName: string, message: string }` | Broadcast when a user disconnects or leaves. |
| `state_sync` | `{ tokens: Record<number, PlayerToken>, npcs: Npc[], lastAction?: string, lastDiceRoll?: DiceRoll, updatedAt: number }` | Full room state synchronization. |
| `dice_rolled` | `{ userId: number, displayName: string, type: string, result: number, timestamp: number }` | Broadcast when a user rolls a die. |
