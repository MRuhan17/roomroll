# RoomRoll

RoomRoll is a lightweight tabletop room manager with email/password auth, room creation and invites, a live board powered by Socket.IO, and optional AI NPC generation.

## Stack

- Frontend: React, Vite, TypeScript, React Query, Zustand, Tailwind
- Backend: Express, TypeScript, Socket.IO
- Data: Supabase tables for users, rooms, and room participants
- Optional AI: OpenAI for NPC generation

## Project Layout

```text
backend/
  src/
    app.ts                  Express app wiring
    index.ts                HTTP + Socket.IO server startup
    config/db.ts            Supabase client setup
    controllers/            Auth and room API handlers
    middleware/             Auth + request logging middleware
    realtime/roomState.ts   In-memory board state and socket handlers
    routes/                 API route definitions
    migrations/init.sql     Database schema
  tests/                    Jest + supertest API coverage

frontend/
  src/
    pages/                  Login, register, lobby, room UI
    services/               Axios API client and Socket.IO client
    store/                  Zustand auth/room state
    types/                  Shared frontend API and board types
```

## Architecture

The app is split into two clear responsibilities:

- Persistent data lives in Supabase: users, rooms, invite codes, and room membership.
- Live room state lives in backend memory: token positions, dice rolls, NPCs, and socket presence.

Request flow:

1. The frontend authenticates through `/api/auth/register` and `/api/auth/login`.
2. The frontend calls `/api/rooms` endpoints to create, join, list, and fetch room details.
3. After loading a room, the frontend opens a Socket.IO connection and emits `join_room`.
4. The backend becomes the source of truth for live board actions and broadcasts `state_sync` updates.

Important note: board state is currently in-memory, so token positions, dice history, and spawned NPCs reset when the backend restarts.

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Create `backend/.env` from `backend/.env.example` and `frontend/.env` from `frontend/.env.example`.

Recommended backend variables:

- `PORT`: backend port, defaults to `5000`
- `CORS_ORIGIN`: frontend origin such as `http://localhost:5173`
- `JWT_SECRET`: secret used to sign auth tokens
- `SUPABASE_URL`: your Supabase project URL
- `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`: backend Supabase key
- `OPENAI_API_KEY`: optional, only needed for NPC generation

Recommended frontend variables:

- `VITE_API_BASE_URL`: backend base URL, usually `http://localhost:5000`

The backend also accepts the legacy `NEXT_PUBLIC_SUPABASE_*` names for compatibility with the current local setup.

### 3. Create the database schema

Run the SQL in `backend/src/migrations/init.sql` against your Supabase Postgres database.

### 4. Start the apps

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/health`

## Scripts

Backend:

- `npm run dev`: start the API/server with nodemon
- `npm run build`: compile TypeScript to `dist/`
- `npm test`: run Jest API tests

Frontend:

- `npm run dev`: start Vite dev server
- `npm run build`: type-check and build production assets
- `npm run preview`: preview the production build

## API Summary

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`

Rooms:

- `POST /api/rooms`
- `POST /api/rooms/join`
- `GET /api/rooms`
- `GET /api/rooms/:id`
- `POST /api/rooms/:id/npc`

Realtime events:

- Client to server: `join_room`, `update_token`, `roll_dice`
- Server to client: `user_joined`, `user_left`, `dice_rolled`, `state_sync`

## Testing

Backend API coverage uses Jest and Supertest and currently covers:

- Auth registration success and validation
- Auth login success and invalid credentials
- Room creation
- Room joining
- Room listing
- Room detail fetch
- Auth middleware rejection without a token

Run tests with:

```bash
cd backend
npm test
```

## Logging

The backend now includes:

- Structured application logs
- Request-level HTTP logging
- Socket connection lifecycle logging
- Controller error logging for auth and room flows
