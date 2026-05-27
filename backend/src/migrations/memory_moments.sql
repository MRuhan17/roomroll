-- Migration to support Memory Moments System (10.6.4)
-- Adds columns to track emotionally significant campaign memories and index them for performance

ALTER TABLE campaign_memories ADD COLUMN IF NOT EXISTS is_emotional_moment BOOLEAN DEFAULT FALSE;
ALTER TABLE campaign_memories ADD COLUMN IF NOT EXISTS moment_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_campaign_memories_is_emotional_moment ON campaign_memories(is_emotional_moment);
