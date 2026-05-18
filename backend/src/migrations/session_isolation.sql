-- Migration to add session_id and room_id to world state tables for strict isolation
ALTER TABLE campaign_events ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE campaign_events ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE session_logs ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

ALTER TABLE campaign_world_events ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE campaign_world_events ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

ALTER TABLE campaign_quests ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE campaign_quests ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

ALTER TABLE campaign_memories ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE campaign_memories ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

ALTER TABLE dice_rolls ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE dice_rolls ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

ALTER TABLE map_tokens ADD COLUMN IF NOT EXISTS session_id VARCHAR(50);
ALTER TABLE map_tokens ADD COLUMN IF NOT EXISTS room_id VARCHAR(50);

-- Create indexes for session-level queries
CREATE INDEX IF NOT EXISTS idx_campaign_events_session_id ON campaign_events(session_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_session_id ON session_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_campaign_world_events_session_id ON campaign_world_events(session_id);
CREATE INDEX IF NOT EXISTS idx_campaign_quests_session_id ON campaign_quests(session_id);
CREATE INDEX IF NOT EXISTS idx_campaign_memories_session_id ON campaign_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_dice_rolls_session_id ON dice_rolls(session_id);
CREATE INDEX IF NOT EXISTS idx_map_tokens_session_id ON map_tokens(session_id);
