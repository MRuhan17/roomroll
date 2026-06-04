-- Security Audit Migration: RLS & IDOR Mitigation

-- 1. Add user_id to map_tokens for ownership verification
ALTER TABLE map_tokens ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add user_id to campaign_maps for ownership verification
ALTER TABLE campaign_maps ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 3. ENABLE ROW LEVEL SECURITY across all core tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_lore_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_factions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_world_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_preferences ENABLE ROW LEVEL SECURITY;

-- Note: The application connects via the Supabase Service Role Key for most operations,
-- which bypasses RLS. These policies are critical safeguards if PostgREST (anon key)
-- is ever exposed to the frontend directly. Since RoomRoll uses custom integer IDs,
-- we extract the user ID from the JWT sub claim instead of using Supabase's auth.uid().
CREATE OR REPLACE FUNCTION public.jwt_user_id() RETURNS integer AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::integer;
$$ LANGUAGE SQL STABLE;

-- USERS
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (public.jwt_user_id() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (public.jwt_user_id() = id);

-- CONSENT PREFERENCES
CREATE POLICY "Users can view their own consent" ON consent_preferences FOR SELECT USING (public.jwt_user_id() = user_id);
CREATE POLICY "Users can update their own consent" ON consent_preferences FOR UPDATE USING (public.jwt_user_id() = user_id);
CREATE POLICY "Users can insert their own consent" ON consent_preferences FOR INSERT WITH CHECK (public.jwt_user_id() = user_id);

-- CAMPAIGNS & PARTICIPANTS
CREATE POLICY "Campaign members can view campaign" ON campaigns FOR SELECT USING (
    id IN (SELECT campaign_id FROM campaign_participants WHERE user_id = public.jwt_user_id())
);
CREATE POLICY "Participants can view their own memberships" ON campaign_participants FOR SELECT USING (public.jwt_user_id() = user_id);

-- CHARACTERS
CREATE POLICY "Users can view characters in their campaigns" ON characters FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM campaign_participants WHERE user_id = public.jwt_user_id())
);
CREATE POLICY "Users can update their own characters" ON characters FOR UPDATE USING (public.jwt_user_id() = user_id);

-- TOKENS
CREATE POLICY "Users can view tokens in their campaigns" ON map_tokens FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM campaign_participants WHERE user_id = public.jwt_user_id())
);
CREATE POLICY "Users can manage their own tokens" ON map_tokens FOR ALL USING (public.jwt_user_id() = user_id);

-- MAPS
CREATE POLICY "Users can view maps in their campaigns" ON campaign_maps FOR SELECT USING (
    campaign_id IN (SELECT campaign_id FROM campaign_participants WHERE user_id = public.jwt_user_id())
);
CREATE POLICY "Users can manage their own maps" ON campaign_maps FOR ALL USING (public.jwt_user_id() = user_id);
