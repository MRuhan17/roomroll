-- RoomRoll Session Lifecycle System Migration
-- Adds support for session snapshots, recovery systems, and last-played timestamps.

-- 1. Add session_snapshot column to session_logs table to persist active campaign state
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS session_snapshot JSONB;

-- 2. Add last_played_at column to campaigns table to track active timing
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Add index for session_logs timestamp sorting
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at DESC);
