# Deployment & Environment Configuration

This document outlines the required environment configurations, local development setup, and production deployment architecture for RoomRoll.

## Environment Variables

The system requires several environment variables for both the backend API and the frontend application.

### Backend (`backend/.env`)

Required configuration for the Express/Socket.IO backend:

| Variable | Description | Default/Example |
|----------|-------------|-----------------|
| `PORT` | The port the backend server runs on. | `5000` |
| `CORS_ORIGIN` | The allowed origin for CORS (should point to frontend). | `http://localhost:5173` |
| `JWT_SECRET` | Secret key used to sign JWT tokens for auth. | `your-secret-key` |
| `SUPABASE_URL` | URL for the Supabase instance. | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key. | `your-anon-key` |
| `OPENAI_API_KEY` | Optional: OpenAI API Key for AI/NPC features. | `sk-...` |

### Frontend (`frontend/.env`)

Required configuration for the Vite React frontend:

| Variable | Description | Default/Example |
|----------|-------------|-----------------|
| `VITE_API_URL` | Base URL for the backend API endpoints. | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Base URL for the Socket.IO server. | `http://localhost:5000` |

## Local Development Setup

To run RoomRoll locally:

1. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configure Environment:**
   - Copy `backend/.env.example` to `backend/.env` and fill in the values.
   - Copy `frontend/.env.example` to `frontend/.env`.

3. **Database Setup:**
   - Create a Supabase project and apply the migrations located in `backend/src/migrations/`.

4. **Start the servers:**
   ```bash
   # Terminal 1: Backend
   cd backend && npm run dev
   
   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

## Production Architecture

### Backend Deployment (Fly.io)

The backend is configured for deployment on [Fly.io](https://fly.io), utilizing a `Dockerfile` and `fly.toml` configuration. 

Key configurations from `fly.toml`:
- **App Name:** `roomroll-api-backend`
- **Primary Region:** `bom` (Mumbai)
- **Port:** Internal port mapped to `8080`.
- **Health Checks:** Configured to ping `/health` on a 30s interval.
- **Environment:** Sets `NODE_ENV = "production"`.

**Deployment Command:**
```bash
fly deploy
```

Secrets management for Fly.io:
```bash
fly secrets set JWT_SECRET=... SUPABASE_URL=... SUPABASE_ANON_KEY=... OPENAI_API_KEY=...
```

### Frontend Deployment

The frontend is a static Vite build. Standard deployment strategy is to use a CDN/Hosting provider like Vercel, Netlify, or AWS S3/CloudFront.

**Build Command:**
```bash
npm run build
```

**Production Env Variables (e.g. on Vercel):**
- Set `VITE_API_URL` to the Fly.io backend URL (e.g., `https://roomroll-api-backend.fly.dev`).
- Set `VITE_SOCKET_URL` to the Fly.io backend URL.

### Supabase Configuration

Supabase handles data persistence and authentication.
- **Database:** PostgreSQL.
- **Migrations:** Managed via `backend/src/migrations/`.
- **Security:** Relies on backend service layer authentication and Row Level Security (RLS) policies defined in `rls_policies*.sql`.

## CI/CD Flow (Planned)

Continuous Integration and Continuous Deployment pipelines are currently **Planned**.

**Intended Pipeline:**
1. PR creation triggers automated API tests (`npm test` in backend).
2. Merges to `main` trigger automated build and deployment:
   - Frontend deployed to Vercel.
   - Backend deployed to Fly.io via GitHub Actions.
