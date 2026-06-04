# RoomRoll

RoomRoll is a lightweight tabletop room manager with email/password auth, room creation and invites, a live board powered by Socket.IO, and optional AI NPC generation.

## Documentation Index

The RoomRoll repository contains comprehensive, code-generated documentation covering all aspects of the architecture and product features.

### Core Systems
- [Architecture](docs/architecture.md): System context, containers, and data flow.
- [Database](docs/database.md): ER diagrams, tables, RLS, and constraints.
- [API Documentation](docs/api.md): REST endpoints and payloads.
- [Realtime Collaboration](docs/realtime.md): Socket.IO events and state sync.
- [AI System](docs/ai.md): OpenAI integration, memory, and prompts.

### Technical Implementation
- [Backend Architecture](docs/backend.md): Express, Middleware, and Services.
- [Frontend Architecture](docs/frontend.md): React, Vite, Zustand, and React Query.
- [Authentication](docs/auth.md): Login, Session, JWT lifecycle.
- [Security](docs/security.md): RLS, input sanitization, rate limiting.
- [Permissions](docs/permissions.md): Role-based access control.

### Product Features
- [Rooms](docs/rooms.md): Room lifecycles, invites, and limits.
- [Campaigns](docs/campaigns.md): Lore, Maps, Characters, and history.

### Infrastructure & Operations
- [Deployment](docs/deployment.md): Environment variables, Vercel, and Fly.io configs.
- [Analytics](docs/analytics.md): Current event tracking.
- [Roadmap](docs/roadmap.md): Planned features and future vision.
- [Glossary](docs/glossary.md): Domain-specific terms.

## Quick Architecture

The app is split into two clear responsibilities:
- Persistent data lives in Supabase: users, rooms, invite codes, and room membership.
- Live room state lives in backend memory (with planned Redis migration): token positions, dice rolls, NPCs, and socket presence.

## Local Setup

See the [Deployment & Setup Guide](docs/deployment.md) for full instructions on required `.env` variables and running the project locally.

Quick start:
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```

## Contributing

Contributions are welcome! Please ensure that you check the existing architecture and documentation before submitting PRs, and make sure to update the documentation in `docs/` if you are modifying core routes, socket events, or database schemas.
