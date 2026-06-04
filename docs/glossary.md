# Glossary

This document defines domain-specific terminology used throughout the RoomRoll project.

| Term | Definition |
|------|------------|
| **Room** | A virtual session where users connect in real-time to interact with the board, roll dice, and manage tokens. |
| **Campaign** | An overarching story or game that contains multiple sessions, lore, characters, and maps. |
| **Host / DM (Dungeon Master)** | The creator of a Room or Campaign. They hold elevated permissions allowing them to manage the board state, invite users, and control AI NPCs. |
| **Player** | A participant in a Room or Campaign who does not have Host privileges. |
| **NPC (Non-Player Character)** | Characters controlled by the system (often generated or driven by the AI integration) rather than a human player. |
| **Token** | A visual representation of a character or entity on the virtual board. |
| **Lore** | Background information, story beats, or world-building text associated with a Campaign. |
| **State Sync** | The process by which the server broadcasts the authoritative board state to all connected clients via Socket.IO. |
| **RLS (Row Level Security)** | A Supabase PostgreSQL feature used to restrict data access on a per-user basis directly at the database level. |
