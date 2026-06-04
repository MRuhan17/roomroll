# RoomRoll: Campaigns Documentation

This document outlines the current state of Campaign management in the RoomRoll backend, including features that are implemented and those that are planned.

## Lifecycle

### Creation & Joining
- **Creation**: DMs can create campaigns (`POST /campaigns`) specifying world type, play mode, genre, tone, pacing intensity, and critical arcs.
- **Joining**: Players can join an existing campaign via an invite code (`POST /campaigns/join`).
- **Retrieval**: Users can fetch their active campaign, list all campaigns they are part of, and retrieve specific campaign details and state snapshots.
- **Updates**: DMs can update campaign descriptions, world types, ambience, and pacing parameters.

## Session History
- **Recaps**: Session histories are maintained via cinematic recaps. DMs can retrieve past session logs (`GET /campaigns/:campaignId/sessions/recaps`) or generate AI-driven cinematic recaps for a session (`POST .../recap/generate`).
- **Recovery**: DMs have the ability to rollback/recover a campaign's state to a previous session snapshot (`POST .../recover`). 

## Maps
- **Management**: DMs can create maps by providing an image URL or uploading a base64 image (`POST .../maps`). Maps can also be configured with a grid.
- **Activation & Fog of War**: DMs can activate specific maps for the campaign and update the reveal state (fog of war) to control what players can see.

## Lore
- **Entities**: DMs can create Lore Entries and Factions. 
- **Visibility**: Lore and factions can be marked as secret. Players can only view lore and factions that have been discovered or are not secret.
- **Discovery System**: DMs can trigger discovery events for specific entities (`POST .../discover`), which broadcasts the discovery to players in real-time and adds it to the campaign's discoveries timeline.
- **World Events**: The timeline tracks both discoveries and broader world events.

## Characters
- **Creation**: Both DMs and players can create characters, defining stats, background, level, and currency. DMs can assign characters to specific players.
- **Management**: Characters can be updated, and DMs can award XP with metadata for reasoning.
- **Inventory & Equipment**: Players and DMs can add, update, equip, and unequip inventory items (weapons, armor, consumables).
- **Status Effects**: DMs and character owners can add, update, or remove status effects (buffs, debuffs, conditions).
- **Permissions**: Only the DM and the character's owner can manage a character's inventory, equipment, and status effects.

## Attachments
- **Status**: **Planned**
- **Description**: Uploading or managing external file attachments (e.g., custom PDFs, extended character sheets, audio files) is not yet implemented.
