# RoomRoll Backend Architecture

This document outlines the architecture, organization, and key patterns used in the RoomRoll Express.js backend.

## App Structure & Initialization

*   **`src/app.ts`**: The core Express application factory (`createApp`). It sets up foundational middleware (CORS, JSON body parser, request logging), defines global route prefixes, and handles catch-all error responses. It also includes global parameter decoders (`app.param`) for non-sequential IDs like `campaignId`.
*   **`src/index.ts`**: The entry point. It wraps the Express app with a standard Node HTTP server, initializes Socket.io for real-time multiplayer features (`initializeSocket` and `registerRealtimeHandlers`), and manages background tasks (such as the weekly email chronicle scheduler). Process-level error handling (`unhandledRejection`, `uncaughtException`) is handled here.

## Route Organization

Routes are mounted in `app.ts` with standard `/api` prefixes and are defined in `src/routes/`:

*   `/api/auth` -> `authRoutes`: User registration, login, token refresh.
*   `/api/rooms` -> `roomRoutes`: Real-time room management.
*   `/api/campaigns` -> `campaignRoutes`: Core campaign CRUD, joining campaigns, pacing, and AI-driven features (story prep, session recaps, tavern, panic recovery).
*   `/api/campaigns/:campaignId/maps` -> `mapRoutes`: Map management.
*   `/api/campaigns/:campaignId/tokens` -> `tokenRoutes`: Token management.
*   `/api/campaigns/:campaignId/characters` -> `characterRoutes`: Character management.
*   `/api/campaigns/:id/world` -> `loreRoutes`: Lore and world-building events.
*   `/api/ai` -> `aiRoutes`: AI narration and memory generation endpoints.

## Architectural Patterns

### Service Layer Pattern
The backend adheres to a clean separation of concerns by utilizing a Service Layer:
*   **Controllers (`src/controllers/`)**: Responsible solely for extracting request data, calling the appropriate Service functions, and returning HTTP responses. They do not handle database connections or complex business logic directly.
*   **Services (`src/services/`)**: The core business logic layer. These modules (e.g., `campaignService.ts`, `tavernService.ts`, `memoryService.ts`) handle data transformation, encapsulate database operations, and enforce business rules.

### Middleware Chain
Routes typically follow a strict middleware execution chain:
1.  **Authentication (`authenticateRequest`)**: Validates the `Bearer` JWT token via the auth service. If invalid/expired, returns a 401. Attaches the decoded user to `req.user`.
2.  **Rate Limiting**: `express-rate-limit` is used heavily (e.g., `campaignLimiter`, `aiLimiter`) to prevent spam and control AI usage costs.
3.  **Validation (`validateBody`)**: Validates the request body against Zod schemas.

### Validation Flow
Request validation is powered by `zod` (`src/middleware/validationMiddleware.ts`). The `validateBody` middleware accepts a Zod schema (e.g., `campaignSchema`, `characterSchema`) and parses the incoming `req.body`. If validation fails, it intercepts the request and responds with a `400 Bad Request` containing structured error details mapping to the failed fields.

### Error Handling
*   **Global Express Error Handler**: A catch-all middleware in `app.ts` logs unhandled errors using the custom logger and returns a generic `500 Unexpected server error` to avoid leaking stack traces to the client.
*   **Process-Level Logs**: `index.ts` catches `unhandledRejection` and `uncaughtException` events. Uncaught exceptions log the error and forcefully exit the process to avoid undefined state.

### Supabase Integration
Database access is achieved via the official `@supabase/supabase-js` client, configured in `src/config/db.ts`. 
*   It initializes using the `SUPABASE_SERVICE_ROLE_KEY` to bypass Row Level Security (RLS) policies within the backend environment, trusting the backend's Service Layer and Controllers to enforce authorization (e.g., checking if a user is a campaign member/DM).
*   The client is imported directly into the Service files to execute database queries.
*   WebSockets are configured on the Supabase client for potential realtime DB subscriptions.

### AI Integration
AI logic is encapsulated within `src/ai/aiService.ts`:
*   **Prompt Builders**: Separate prompt builders (`promptBuilder.ts`) format contextual data (campaign snapshots, current state) into structured instructions.
*   **OpenAI Integration**: The `callOpenAi` wrapper handles HTTP calls to the OpenAI API using the native `fetch` API. It includes a custom `AbortController` configured for a 12-second timeout.
*   **Rate Limiting & Safety**: Includes a 15-second per-user memory cache cooldown (`aiCooldowns`) to prevent runaway AI requests. It also features `sanitizePlayerAction` which truncates long inputs and strips out common prompt-injection phrases.
*   **Features**: AI drives various game mechanics like procedural tavern generation, derailment detection, session recaps, dynamic narration, and cinematic roll interpretations. AI outcomes are saved directly to campaign state or stored as long-term memory logs.
