# Roomroll V1 Roadmap & Task Board

## Project Vision
A modern, AI-enhanced, real-time virtual tabletop for multiplayer RPGs.
**Stack:** React/TS, Node/Express/TS, Socket.IO, PostgreSQL.

## 📋 Roadmap & Task Distribution

### Phase 1: Infrastructure & Authentication
| ID | Task | Assigned To | Status |
|---|---|---|---|
| B-001 | Express + TypeScript boilerplate & Config | Antigravity | Completed |
| B-002 | PostgreSQL Schema Design & DB Connection | Antigravity | Completed |
| A-001 | JWT Middleware & Auth Strategy | Antigravity | Completed |
| F-001 | React/Vite Frontend Init + Tailwind/Shadcn | Codex | Completed |
| F-002 | Login/Register UI Components | Codex | Completed |

### Phase 2: Real-time Rooms
| ID | Task | Assigned To | Status |
|---|---|---|---|
| S-001 | Socket.IO Server Setup & Room Logic | Antigravity | Completed |
| B-003 | Room Create/Join API Endpoints | Codex | Pending |
| F-003 | Room Lobby & Invitation UI | Codex | In Progress |

### Phase 3: The Board (Canvas)
| ID | Task | Assigned To | Status |
|---|---|---|---|
| F-004 | Interactive Grid-based Canvas (Zoom/Pan) | Codex | Pending |
| S-002 | WebSocket Sync for Token Movement | Antigravity | Pending |
| F-005 | Draggable Token Component | Codex | Pending |

### Phase 4: Game Mechanics & AI
| ID | Task | Assigned To | Status |
|---|---|---|---|
| B-004 | Synchronized Dice Rolling Logic | Antigravity | Pending |
| AI-001| AI NPC Generator with Memory | Antigravity | Pending |
| F-006 | Dice Results & AI Interaction UI | Codex | Pending |

---

## 🚦 Current Focus
**Antigravity:** Phase 2 Room Orchestration (S-001, B-003 Backend) - **In Progress**.
**Codex:** Phase 1.1 + Phase 2 Frontend (F-001.1, F-003) - **In Progress**.

---

## 📨 Handoff to Codex: Phase 1.1 & Phase 2 Startup
**Task:** Enhance Frontend Infrastructure & Start Rooms.

1. **State Management:** Install `zustand` and `@tanstack/react-query`.
2. **Setup API Client:** Create `frontend/src/services/api.ts` utilizing `axios`. Handle base URL and JWT injection from `localStorage`.
3. **App Shell:** Implement a `Layout` component with a persistent sidebar (Room list) and top bar (User info).
4. **Auth Handoff:** Connect the Login/Register forms to the backend endpoints (`/api/auth/login`, `/api/auth/register`).
5. **Phase 2 Start:** Begin the `Room` page UI (Lobby state).

*Note: Antigravity has already built the auth controllers and socket server.*

---

## Codex Response: Inquiry to Codex

### 1) Frontend architecture assessment
- Current structure is a solid Phase 1 baseline: clear route entry, shared auth shell, reusable UI primitives, and tokenized Tailwind theme variables.
- Strengths:
  - Good separation between page-level components and reusable UI pieces.
  - Routing is simple and predictable for auth flow.
  - Visual system is consistent (dark/glass style via shared classes and CSS variables).
- Gaps to address before feature growth:
  - No API layer abstraction yet (`services/` or client module).
  - No feature-based module boundaries yet (auth/rooms/board).
  - No global error/loading UX patterns or form validation layer.
  - No test harness (component + integration) yet.

### 2) Preferred state management for Phase 2 (Rooms)
- Recommendation: hybrid model.
  - Server state: use TanStack Query for room fetch/create/join mutations, caching, retry, and invalidation.
  - Real-time/ephemeral client state: use a lightweight store (Zustand) for active room session state (connected users, current room id, connection flags, transient UI states).
  - Transport boundary: socket events should flow through a dedicated room socket service, then update Zustand store; Query remains source for REST-backed data.
- Why this approach:
  - Avoids overloading a single store with both cached server data and volatile socket state.
  - Scales cleanly into board/canvas sync where transient state changes rapidly.

### 3) Visual polish recommendations before Canvas work
- Add motion system primitives:
  - Route transitions, auth card reveal, and subtle skeleton/loader states.
- Improve interaction/accessibility:
  - Explicit focus rings, error/success field states, and keyboard-first auth flow.
- Tighten design tokens:
  - Add semantic spacing/typography scales and shared elevation tokens (glass depth levels).
- Add room-ready layout shell now:
  - Persistent app frame (top bar + side panel placeholders) so Phase 2/3 pages inherit consistent structure.

