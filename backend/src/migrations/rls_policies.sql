-- RoomRoll Database Hardening: Row Level Security (RLS) Policies
-- This migration enables RLS on all tables and defines tenant-isolation policies.
-- In production, the backend accesses Supabase using the service_role key, bypassing RLS,
-- but these policies are crucial for direct database access security (defense-in-depth).

-- 1. Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_rolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_status_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_progression_log ENABLE ROW LEVEL SECURITY;

-- 2. Define Campaign policies
-- Members of the campaign or the host can view the campaign.
CREATE POLICY select_campaign ON campaigns
    FOR SELECT
    USING (
        auth.uid() = dm_user_id 
        OR EXISTS (
            SELECT 1 FROM campaign_participants 
            WHERE campaign_id = id AND user_id = auth.uid()
        )
    );

-- Only host can insert/update/delete.
CREATE POLICY insert_campaign ON campaigns
    FOR INSERT
    WITH CHECK (auth.uid() = dm_user_id);

CREATE POLICY update_campaign ON campaigns
    FOR UPDATE
    USING (auth.uid() = dm_user_id)
    WITH CHECK (auth.uid() = dm_user_id);

CREATE POLICY delete_campaign ON campaigns
    FOR DELETE
    USING (auth.uid() = dm_user_id);

-- 3. Define Campaign Participants policies
CREATE POLICY select_participant ON campaign_participants
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND dm_user_id = auth.uid()
        )
    );

CREATE POLICY insert_participant ON campaign_participants
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY delete_participant ON campaign_participants
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND dm_user_id = auth.uid()
        )
    );

-- 4. Define Character policies
-- Characters can be viewed by anyone in the campaign.
CREATE POLICY select_character ON characters
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM campaign_participants 
            WHERE campaign_id = characters.campaign_id AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = characters.campaign_id AND dm_user_id = auth.uid()
        )
    );

-- Characters can only be created/updated/deleted by their owner or the DM.
CREATE POLICY insert_character ON characters
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND dm_user_id = auth.uid()
        )
    );

CREATE POLICY update_character ON characters
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND dm_user_id = auth.uid()
        )
    );

CREATE POLICY delete_character ON characters
    FOR DELETE
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM campaigns 
            WHERE id = campaign_id AND dm_user_id = auth.uid()
        )
    );

-- 5. Define general campaign-nested tables RLS policies
-- Applies to: campaign_events, session_logs, campaign_maps, map_tokens, dice_rolls, campaign_world_events, campaign_quests, campaign_memories
-- Selection is allowed for any active campaign participant.
CREATE POLICY select_campaign_event ON campaign_events FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_events.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_session_log ON session_logs FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = session_logs.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_campaign_map ON campaign_maps FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_maps.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_map_token ON map_tokens FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = map_tokens.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_dice_roll ON dice_rolls FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = dice_rolls.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_world_event ON campaign_world_events FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_world_events.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_quest ON campaign_quests FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_quests.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_memory ON campaign_memories FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_memories.campaign_id AND user_id = auth.uid()));
