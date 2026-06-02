-- RoomRoll RLS Migration Rollback: Revert Custom JWT to auth.uid()

DROP FUNCTION IF EXISTS public.jwt_user_id();

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

-- Restore Original Broken UUID Policies
CREATE POLICY select_campaign ON campaigns FOR SELECT USING (auth.uid() = dm_user_id OR EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = id AND user_id = auth.uid()));
CREATE POLICY insert_campaign ON campaigns FOR INSERT WITH CHECK (auth.uid() = dm_user_id);
CREATE POLICY update_campaign ON campaigns FOR UPDATE USING (auth.uid() = dm_user_id) WITH CHECK (auth.uid() = dm_user_id);
CREATE POLICY delete_campaign ON campaigns FOR DELETE USING (auth.uid() = dm_user_id);

CREATE POLICY select_participant ON campaign_participants FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND dm_user_id = auth.uid()));
CREATE POLICY insert_participant ON campaign_participants FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY delete_participant ON campaign_participants FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND dm_user_id = auth.uid()));

CREATE POLICY select_character ON characters FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = characters.campaign_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM campaigns WHERE id = characters.campaign_id AND dm_user_id = auth.uid()));
CREATE POLICY insert_character ON characters FOR INSERT WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND dm_user_id = auth.uid()));
CREATE POLICY update_character ON characters FOR UPDATE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND dm_user_id = auth.uid()));
CREATE POLICY delete_character ON characters FOR DELETE USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND dm_user_id = auth.uid()));

CREATE POLICY select_campaign_event ON campaign_events FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_events.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_session_log ON session_logs FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = session_logs.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_campaign_map ON campaign_maps FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_maps.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_map_token ON map_tokens FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = map_tokens.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_dice_roll ON dice_rolls FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = dice_rolls.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_world_event ON campaign_world_events FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_world_events.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_quest ON campaign_quests FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_quests.campaign_id AND user_id = auth.uid()));
CREATE POLICY select_memory ON campaign_memories FOR SELECT USING (EXISTS (SELECT 1 FROM campaign_participants WHERE campaign_id = campaign_memories.campaign_id AND user_id = auth.uid()));
