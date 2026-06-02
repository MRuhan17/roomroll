-- RoomRoll RLS Migration: UUID to Custom JWT Integer Fix

-- 1. Create JWT Extractor Function
CREATE OR REPLACE FUNCTION public.jwt_user_id() RETURNS integer AS $$
BEGIN
    RETURN (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'id')::integer;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Drop Old Broken Policies
DROP POLICY IF EXISTS select_campaign ON campaigns;
DROP POLICY IF EXISTS insert_campaign ON campaigns;
DROP POLICY IF EXISTS update_campaign ON campaigns;
DROP POLICY IF EXISTS delete_campaign ON campaigns;

DROP POLICY IF EXISTS select_participant ON campaign_participants;
DROP POLICY IF EXISTS insert_participant ON campaign_participants;
DROP POLICY IF EXISTS delete_participant ON campaign_participants;

DROP POLICY IF EXISTS select_character ON characters;
DROP POLICY IF EXISTS insert_character ON characters;
DROP POLICY IF EXISTS update_character ON characters;
DROP POLICY IF EXISTS delete_character ON characters;

DROP POLICY IF EXISTS select_campaign_event ON campaign_events;
DROP POLICY IF EXISTS select_session_log ON session_logs;
DROP POLICY IF EXISTS select_campaign_map ON campaign_maps;
DROP POLICY IF EXISTS select_map_token ON map_tokens;
DROP POLICY IF EXISTS select_dice_roll ON dice_rolls;
DROP POLICY IF EXISTS select_world_event ON campaign_world_events;
DROP POLICY IF EXISTS select_quest ON campaign_quests;
DROP POLICY IF EXISTS select_memory ON campaign_memories;

-- 3. Recreate Policies with Custom JWT Claims

-- To prevent infinite recursion, campaigns are visible to DMs (directly) and Members (by querying campaign_participants without triggering its RLS, which is a bit tricky). 
-- Actually, PostgreSQL RLS recursion happens because `campaign_participants` queries `campaigns`, and `campaigns` queries `campaign_participants`.
-- We can fix this by removing the reciprocal checks. DMs can naturally read their own participants if participants policy only checks `user_id`. But DMs wouldn't see other players!
-- The correct fix is to use a SECURITY DEFINER function to bypass RLS for these specific checks.

CREATE OR REPLACE FUNCTION public.is_campaign_member(camp_id integer) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = camp_id AND user_id = public.jwt_user_id());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_campaign_dm(camp_id integer) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM campaigns WHERE id = camp_id AND dm_user_id = public.jwt_user_id());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY select_campaign ON campaigns FOR SELECT USING (
    public.jwt_user_id() = dm_user_id OR public.is_campaign_member(id)
);
CREATE POLICY insert_campaign ON campaigns FOR INSERT WITH CHECK (public.jwt_user_id() = dm_user_id);
CREATE POLICY update_campaign ON campaigns FOR UPDATE USING (public.jwt_user_id() = dm_user_id) WITH CHECK (public.jwt_user_id() = dm_user_id);
CREATE POLICY delete_campaign ON campaigns FOR DELETE USING (public.jwt_user_id() = dm_user_id);

CREATE POLICY select_participant ON campaign_participants FOR SELECT USING (
    user_id = public.jwt_user_id() OR public.is_campaign_dm(campaign_id)
);
CREATE POLICY insert_participant ON campaign_participants FOR INSERT WITH CHECK (user_id = public.jwt_user_id());
CREATE POLICY delete_participant ON campaign_participants FOR DELETE USING (
    user_id = public.jwt_user_id() OR public.is_campaign_dm(campaign_id)
);

CREATE POLICY select_character ON characters FOR SELECT USING (
    public.is_campaign_member(campaign_id) OR public.is_campaign_dm(campaign_id)
);
CREATE POLICY insert_character ON characters FOR INSERT WITH CHECK (
    user_id = public.jwt_user_id() OR public.is_campaign_dm(campaign_id)
);
CREATE POLICY update_character ON characters FOR UPDATE USING (
    user_id = public.jwt_user_id() OR public.is_campaign_dm(campaign_id)
);
CREATE POLICY delete_character ON characters FOR DELETE USING (
    user_id = public.jwt_user_id() OR public.is_campaign_dm(campaign_id)
);

CREATE POLICY select_campaign_event ON campaign_events FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_session_log ON session_logs FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_campaign_map ON campaign_maps FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_map_token ON map_tokens FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_dice_roll ON dice_rolls FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_world_event ON campaign_world_events FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_quest ON campaign_quests FOR SELECT USING (public.is_campaign_member(campaign_id));
CREATE POLICY select_memory ON campaign_memories FOR SELECT USING (public.is_campaign_member(campaign_id));
