-- RoomRoll Database Migration: Cinematic Dice System
-- Add classification JSONB and narration TEXT columns to dice_rolls to persist cinematic outcomes.

ALTER TABLE dice_rolls ADD COLUMN IF NOT EXISTS classification JSONB DEFAULT NULL;
ALTER TABLE dice_rolls ADD COLUMN IF NOT EXISTS narration TEXT DEFAULT NULL;

-- High performance index on classification tier for dashboard querying ("Hall of Legends")
CREATE INDEX IF NOT EXISTS idx_dice_rolls_classification_tier ON dice_rolls ((classification->>'tier'));
