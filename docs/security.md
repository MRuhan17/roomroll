# Security Practices

RoomRoll employs multiple layers of security to ensure data integrity, restrict access, and mitigate common attack vectors.

## 1. Input Validation and Sanitization (Zod)
All critical API routes use strict schema validation to prevent malformed or malicious payloads from hitting the database or AI endpoints.
- Implemented via `zod` and `validateBody` middleware.
- Verifies types, maximum string lengths, enum correctness, and structural integrity.
- Sanitizes incoming payload structures (e.g., `campaignSchema`, `characterSchema`, `inviteCodeSchema`).
- Blocks NoSQL injection patterns and standard SQL injection vectors at the application edge.

## 2. Rate Limiting
To prevent abuse, credential stuffing, and excessive AI engine usage, `express-rate-limit` is deployed across the application:
- **Auth Routes**: `loginLimiter` and `registerLimiter` restrict authentication endpoints to prevent brute-force attacks.
- **Campaign Endpoints**: A global `campaignLimiter` restricts interactions to 60 requests per minute per User ID (or IP address as a fallback).
- **Campaign Creation**: `campaignCreationLimiter` throttles the creation of campaigns to combat spam.

## 3. Defense-in-Depth Row Level Security (RLS)
Even though the Express backend uses a service role to interface with Supabase, strict Postgres Row Level Security (RLS) policies (`rls_policies.sql`) are applied across all tables.
- Acts as a failsafe against accidental credential leaks or future client-side database querying.
- Isolates multi-tenant data: A user cannot read or write data associated with a `campaign_id` to which they do not belong.

## 4. Environment and Token Safety
- JWT Tokens have short-lived lifespans (24 hours).
- The `app.ts` root script explicitly scrubs and trims incoming environment variables (like `process.env.JWT_SECRET` and `process.env.SUPABASE_KEY`) to prevent whitespace or quote-based configuration errors.
- CORS is restricted to validated origins defined in `corsOptions`.
- Express is configured to respect proxies (`app.set('trust proxy', 1)`), ensuring accurate rate-limiting when behind load balancers or gateways.

## 5. Password Storage
- Plain-text passwords are never stored.
- Processed via `bcrypt` using 10 salt rounds before being stored as `password_hash` in the `users` table.

## 6. Real-Time Security
Socket.IO handlers inherently respect the campaign session structure. Users are authenticated before interacting with room states, and AI story generations are strictly gated behind DM-only backend route checks.
