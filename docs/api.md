# RoomRoll REST API Documentation

This document outlines the REST API endpoints available in the RoomRoll project. All endpoints are implemented (no planned endpoints currently exist). Most endpoints require JWT authentication via the `Authorization` header (`Bearer <token>`).

## Authentication API (`/api/auth`)

### Register
- **Method:** `POST`
- **Endpoint:** `/register`
- **Request Payload:** `{ "displayName": "string", "email": "string", "password": "string" }`
- **Response Payload:** `{ "user": { "id": "number", "displayName": "string", "email": "string" }, "token": "string" }`
- **Error Codes:** 400 (Bad Request), 500 (Server Error)

### Login
- **Method:** `POST`
- **Endpoint:** `/login`
- **Request Payload:** `{ "email": "string", "password": "string" }`
- **Response Payload:** `{ "user": { "id": "number", "displayName": "string", "email": "string" }, "token": "string" }`
- **Error Codes:** 400 (Invalid credentials), 500 (Server Error)

---

## Campaigns API (`/api/campaigns`)

### List User Campaigns
- **Method:** `GET`
- **Endpoint:** `/`
- **Response Payload:** `{ "campaigns": [ { "id": "number", "name": "string", "playerCount": "number", "hostName": "string", "lastActivity": "date", "activeSessionState": "object" } ] }`
- **Error Codes:** 401, 500

### Create Campaign
- **Method:** `POST`
- **Endpoint:** `/`
- **Request Payload:** `{ "name": "string", "description": "string", "worldType": "string", "playMode": "string", "targetSessions": "number" }`
- **Response Payload:** `{ "campaign": "object" }`
- **Error Codes:** 400, 401, 500

### Join Campaign
- **Method:** `POST`
- **Endpoint:** `/join`
- **Request Payload:** `{ "inviteCode": "string" }`
- **Response Payload:** `{ "campaign": "object", "membership": "object" }`
- **Error Codes:** 400, 401, 404, 500

### Get Active Campaign
- **Method:** `GET`
- **Endpoint:** `/active`
- **Response Payload:** `{ "campaign": "object" }`
- **Error Codes:** 401, 404

### Get Campaign Details
- **Method:** `GET`
- **Endpoint:** `/:campaignId`
- **Response Payload:** `{ "campaign": "object", "members": "array" }`
- **Error Codes:** 400, 401, 403, 404

### Update Campaign
- **Method:** `PUT`
- **Endpoint:** `/:campaignId`
- **Request Payload:** `{ "description": "string", "worldType": "string" }`
- **Response Payload:** `{ "campaign": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Update Campaign Ambience
- **Method:** `PUT`
- **Endpoint:** `/:campaignId/ambience`
- **Request Payload:** `{ "ambience": "object" }`
- **Response Payload:** `{ "campaign": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Update Campaign Pacing
- **Method:** `PUT`
- **Endpoint:** `/:campaignId/pacing`
- **Request Payload:** `{ "targetSessions": "number", "completedSessions": "number", "pacingIntensity": "string" }`
- **Response Payload:** `{ "campaign": "object" }`
- **Error Codes:** 400, 401, 403, 404, 500

### Get Campaign Snapshot
- **Method:** `GET`
- **Endpoint:** `/:campaignId/snapshot`
- **Response Payload:** `{ "snapshot": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Story Preparation
- **GET** `/:campaignId/story-prep`: Retrieves current story points for the campaign.
- **POST** `/:campaignId/story-prep/regenerate`: Uses AI to regenerate future story paths.
- **POST** `/:campaignId/story-prep/points`: Manually adds custom story points. Payload: `{ "title": "string", "description": "string", ... }`.
- **PUT** `/:campaignId/story-prep/points/:pointId`: Edits an existing story point.

### Session Recaps & Legends
- **GET** `/:campaignId/sessions/recaps`: Retrieves past session summaries.
- **POST** `/:campaignId/sessions/:sessionId/recap/generate`: Generates a cinematic recap. Payload: `{ "tone": "string" }`.
- **POST** `/:campaignId/sessions/:sessionId/recover`: Restores campaign to a past session snapshot.
- **GET** `/:campaignId/legends`: Retrieves hall of legends data.

### Tavern System
- **GET** `/:campaignId/tavern`: Retrieves the current procedural tavern state.
- **POST** `/:campaignId/tavern/generate`: Uses AI to procedurally generate a new tavern with NPCs.
- **POST** `/:campaignId/tavern/npcs/:npcId/chat`: Chats with a tavern NPC. Payload: `{ "message": "string" }`.
- **POST** `/:campaignId/tavern/factions/:encounterId/respond`: Responds to a faction encounter. Payload: `{ "action": "accept | decline" }`.
- **POST** `/:campaignId/tavern/events/trigger`: Triggers a random tavern event.

### Panic / Derailment Recovery
- **GET** `/:campaignId/panic/detect`: Detects if the campaign has derailed.
- **POST** `/:campaignId/panic/recover`: AI generates potential recovery paths.
- **GET** `/:campaignId/panic/saved`: Retrieves saved recovery options.
- **POST** `/:campaignId/panic/apply`: Applies a chosen recovery path.

---

## Characters API (`/api/campaigns/:campaignId/characters`)

### List Characters
- **Method:** `GET`
- **Endpoint:** `/`
- **Response Payload:** `{ "characters": "array" }`
- **Error Codes:** 400, 401, 403, 500

### Create Character
- **Method:** `POST`
- **Endpoint:** `/`
- **Request Payload:** `{ "userId": "number", "name": "string", "className": "string", "species": "string", "level": "number", "xp": "number" }`
- **Response Payload:** `{ "character": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Get Character
- **Method:** `GET`
- **Endpoint:** `/:characterId`
- **Response Payload:** `{ "character": "object" }`
- **Error Codes:** 400, 401, 403, 404, 500

### Update Character
- **Method:** `PATCH`
- **Endpoint:** `/:characterId`
- **Request Payload:** `{ "name": "string", "className": "string", "level": "number" }`
- **Response Payload:** `{ "character": "object" }`
- **Error Codes:** 400, 401, 403, 404, 500

### Award Experience
- **Method:** `POST`
- **Endpoint:** `/:characterId/xp`
- **Request Payload:** `{ "amount": "number", "reason": "string" }`
- **Response Payload:** `{ "xp_awarded": "number", "new_total": "number" }`
- **Error Codes:** 400, 401, 403, 404, 500

### Inventory & Equipment
- **POST** `/:characterId/inventory`: Add item. Payload: `{ "name": "string", "itemType": "string", "quantity": "number" }`.
- **PATCH** `/:characterId/inventory/:itemId`: Update item.
- **POST** `/:characterId/equipment`: Equip item. Payload: `{ "inventoryItemId": "number", "slot": "string" }`.
- **DELETE** `/:characterId/equipment/:slot`: Unequip item from slot.

### Status Effects
- **POST** `/:characterId/status-effects`: Add effect. Payload: `{ "name": "string", "effectType": "string" }`.
- **PATCH** `/:characterId/status-effects/:effectId`: Update effect.
- **DELETE** `/:characterId/status-effects/:effectId`: Remove effect.

---

## Lore API (`/api/campaigns/:id/world`)

### Get World Data
- **Method:** `GET`
- **Endpoint:** `/`
- **Response Payload:** `{ "lore": "array", "factions": "array", "discoveries": "array", "worldEvents": "array" }`
- **Error Codes:** 401, 403, 500

### Create Lore Entry
- **Method:** `POST`
- **Endpoint:** `/lore`
- **Request Payload:** `{ "title": "string", "category": "string", "content": "string", "is_secret": "boolean", "is_discovered": "boolean" }`
- **Response Payload:** `{ "id": "number", ... }`
- **Error Codes:** 400, 401, 403, 500

### Create Faction
- **Method:** `POST`
- **Endpoint:** `/factions`
- **Request Payload:** `{ "name": "string", "description": "string", "is_secret": "boolean", "is_discovered": "boolean" }`
- **Response Payload:** `{ "id": "number", ... }`
- **Error Codes:** 400, 401, 403, 500

### Discover Entity
- **Method:** `POST`
- **Endpoint:** `/discover`
- **Request Payload:** `{ "entity_type": "lore | faction", "entity_id": "number" }`
- **Response Payload:** `{ "id": "number", ... }`
- **Error Codes:** 400, 401, 403, 500

---

## Maps API (`/api/campaigns/:campaignId/maps`)

### Create Map
- **Method:** `POST`
- **Endpoint:** `/`
- **Request Payload:** `{ "name": "string", "imageUrl": "string", "imageBase64": "string", "gridEnabled": "boolean", "gridSize": "number" }`
- **Response Payload:** `{ "map": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Activate Map
- **Method:** `PATCH`
- **Endpoint:** `/:mapId/activate`
- **Response Payload:** `{ "status": "ok" }`
- **Error Codes:** 400, 401, 403, 500

### Update Reveal State
- **Method:** `PATCH`
- **Endpoint:** `/:mapId/reveal`
- **Request Payload:** `{ "revealState": "object" }`
- **Response Payload:** `{ "map": "object" }`
- **Error Codes:** 400, 401, 403, 500

---

## Rooms API (`/api/rooms`)

### Fetch Rooms
- **Method:** `GET`
- **Endpoint:** `/`
- **Response Payload:** `[ { "id": "number", "name": "string", "code": "string", "ownerId": "number", "createdAt": "date" } ]`
- **Error Codes:** 401, 500

### Create Room
- **Method:** `POST`
- **Endpoint:** `/`
- **Request Payload:** `{ "name": "string" }`
- **Response Payload:** `{ "id": "number", "name": "string", "code": "string", "ownerId": "number", "createdAt": "date" }`
- **Error Codes:** 400, 401, 500

### Join Room
- **Method:** `POST`
- **Endpoint:** `/join`
- **Request Payload:** `{ "code": "string" }`
- **Response Payload:** `{ "id": "number", "name": "string", "code": "string", "ownerId": "number", "createdAt": "date" }`
- **Error Codes:** 400, 401, 404, 500

### Fetch Room Details
- **Method:** `GET`
- **Endpoint:** `/:id`
- **Response Payload:** `{ "id": "number", "name": "string", "code": "string", "participants": "array" }`
- **Error Codes:** 401, 403, 404, 500

### Generate NPC
- **Method:** `POST`
- **Endpoint:** `/:id/npc`
- **Request Payload:** `{ "theme": "string" }`
- **Response Payload:** `{ "id": "string", "name": "string", "description": "string", "hp": "number", "ac": "number" }`
- **Error Codes:** 400, 401, 403, 500, 503

---

## Tokens API (`/api/campaigns/:campaignId/tokens`)

### Create Token
- **Method:** `POST`
- **Endpoint:** `/`
- **Request Payload:** `{ "mapId": "number", "tokenType": "string", "label": "string", "hpCurrent": "number", "hpMax": "number", "position": { "x": "number", "y": "number" }, "isHidden": "boolean" }`
- **Response Payload:** `{ "token": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Move Token
- **Method:** `PATCH`
- **Endpoint:** `/:tokenId/move`
- **Request Payload:** `{ "position": { "x": "number", "y": "number" } }`
- **Response Payload:** `{ "token": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Update Token
- **Method:** `PATCH`
- **Endpoint:** `/:tokenId`
- **Request Payload:** `{ "hpCurrent": "number", "hpMax": "number", "label": "string", "isHidden": "boolean" }`
- **Response Payload:** `{ "token": "object" }`
- **Error Codes:** 400, 401, 403, 500

---

## AI Specific Endpoints (`/api/ai`)

### Generate Narration
- **Method:** `POST`
- **Endpoint:** `/narrate`
- **Request Payload:** `{ "campaignId": "number", "playerAction": "string", "tone": "string" }`
- **Response Payload:** `{ "narration": "object" }`
- **Error Codes:** 400, 401, 403, 500

### Create Memory
- **Method:** `POST`
- **Endpoint:** `/memory`
- **Request Payload:** `{ "campaignId": "number", "summary": "string", "keyFacts": "array" }`
- **Response Payload:** `{ "memory": "object" }`
- **Error Codes:** 400, 401, 403, 500
