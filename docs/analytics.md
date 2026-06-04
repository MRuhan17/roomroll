# Analytics & Events Tracking

This document outlines the analytics and event tracking currently implemented within the RoomRoll platform.

## Current Implementation

Currently, detailed client-side telemetry (e.g., PostHog, Google Analytics) and structured event-tracking pipelines are **Planned**. 

However, the backend utilizes structured application logging (via `console.info`, `console.error`) in the controllers and socket handlers to track critical system events implicitly:

### System Events Logged (Backend)
- **User Authentication:** 
  - Login attempts (Success/Failure).
  - Registration events.
- **Room Lifecycle:**
  - Room Creation (`roomId`, `hostId`).
  - User joined room (via Socket.IO `join_room` event).
  - User left room (via Socket.IO `disconnect` event).
- **Campaign & AI Events:**
  - Campaign creation.
  - NPC generated.
  - Lore generated.

## Future Analytics Strategy (Planned)

In the future, the goal is to integrate a dedicated analytics provider to track the following metrics for growth and product analysis:

- **Room Created:** To measure engagement and platform adoption.
- **Campaign Started:** To measure long-term user retention.
- **AI Generation Usage:** Tracking volume to correlate with cost optimization metrics.
- **User Joined Room:** To map network effects and virality.
- **Session Duration:** Tracking time-in-app via socket connection durations.
