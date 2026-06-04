# RoomRoll AI Architecture & Documentation

This document outlines the artificial intelligence integration in the RoomRoll project, covering the architecture, context building, memory management, and error handling mechanisms. The AI features empower the Dungeon Master with tools for narration, pacing, NPC interactions, and narrative recovery.

## 1. OpenAI Integration Points

The core AI engine interfaces with OpenAI via the standard `globalThis.fetch` API to `https://api.openai.com/v1/chat/completions`, primarily handled in `backend/src/ai/aiService.ts`.

**Implemented Features:**
- **Model Support:** Uses the `OPENAI_MODEL` environment variable, defaulting to `gpt-4o-mini`.
- **System Timeout:** An `AbortController` provides a strict 12-second timeout protection per request.
- **Cooldown Mechanism:** A 15-second per-user cooldown (`aiCooldowns`) prevents API spam and potential abuse.
- **Security & Sanitization:** Player actions are truncated to 500 characters to prevent token exhaustion. A regex-based prompt injection detection redacts malicious inputs (e.g., `ignore all previous instructions`).
- **Structured Output:** Critical functions request and parse strict JSON responses from the AI.

## 2. Prompt Architecture

The system utilizes modular prompt builders located in `backend/src/ai/promptBuilder.ts` to dynamically assemble instructions based on the campaign state. 

**Implemented Prompts:**
- **Narration Prompts (`buildNarrationPrompt`):** Handles core action-reaction cycles with boundaries (`[PLAYER ACTION BOUNDARY]`) to prevent rule subversion.
- **Cinematic Roll Narration (`buildCinematicRollNarrationPrompt`):** Translates dice roll results (e.g., natural 1s, natural 20s, clutch saves) into descriptive cinematic moments.
- **Cinematic Recap (`buildCinematicRecapPrompt`):** Summarizes session events, highlights, and decisions in a high-fidelity JSON timeline.
- **Derailment Detection (`buildDetectDerailmentPrompt`):** Analyzes recent events to identify "murderhobo" behavior, complete party derailment, or near Total Party Kills.
- **Panic Recovery (`buildPanicRecoveryPrompt`):** Generates precisely 3 immersive narrative recovery paths, backup encounters, and emergency NPCs to help DMs seamlessly redirect a derailed session.
- **Environment, Faction, & NPC Prompts:** Contextual descriptions generated on-demand for world-building, NPC dialogue, and faction reactions.

## 3. Context Building

RoomRoll avoids context window bloating by strategically fetching and combining only relevant pieces of the campaign through a `CampaignSnapshot` (`backend/src/services/campaignStateService.ts`).

**Implemented Context Injection:**
- **Base Context (`buildBaseContext`):** Automatically injects the campaign name, description, active quests, NPCs, and current mood/ambience.
- **Narrative Pacing Engine:** Calculates session progress (completed sessions vs target sessions) to shift the narrative phase organically through stages like *Introduction*, *Rising Conflict*, *Escalation*, *Climax Buildup*, and *Finale & Resolution*.
- **Guidance & Footnotes:** Embeds DM-specific objectives, forbidden lore, and recurring villains directly into the system context.
- **Timeline & Lore:** Injects the last 5-15 recent narrative events, relevant faction descriptions, and world events to maintain continuity.

## 4. Memory Handling

Memory in RoomRoll is categorized into immediate session tracking and long-term narrative impacts, managed through `backend/src/services/memoryService.ts`.

**Implemented Memory Features:**
- **Narration Logs:** Every generated narration is permanently appended to a `session_logs` table for the active session.
- **Emotional Moments Detection:** The AI asynchronously evaluates narration (`detectSignificantMoment`) to check for major campaign milestones such as:
  - Betrayals
  - Failed quests
  - Legendary victories
  - Dead companions
  - Major discoveries
- **Campaign Memories:** Significant facts and emotional milestones are saved via `createCampaignMemory`. These are later injected into the context as "Historical Callbacks" for future AI generations to reference dynamically.
- **Mood & Ambience Tracking:** The AI categorizes the ongoing session's mood (e.g., tension, mystery, horror) and ambience, storing it in the campaign's current session state.

## 5. Token Usage & Error Recovery

Given the unpredictable nature of external APIs, the AI pipeline prioritizes continuity and stability.

**Implemented Fallbacks:**
- **Token Limits:** Hard cap at 500 characters for raw player action inputs.
- **Narration Fallback:** If the OpenAI API times out, fails, or lacks configuration, the system resorts to a built-in template: `"The world responds immediately—[player action]. The scene shifts with a cinematic beat as the consequences ripple outward."`
- **JSON Parse Failure Recovery:** For complex generators (e.g., Future Story Preparation, Session Recaps, Panic Recovery Paths), if the AI fails to return valid JSON, the system intercepts the error and provisions hardcoded default JSON arrays/objects to keep the game running smoothly without user-facing crashes.
- **Memory Fallback:** The `memoryService` utilizes a `catch` block that defaults to storing memory facts inside a robust JSONB structure if the standard database columns fail or are pending a schema migration.

---

*(Note: All features listed above are fully implemented in the current codebase.)*
