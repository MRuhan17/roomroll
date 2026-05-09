CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    world_type VARCHAR(60),
    dm_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    active_map_id INTEGER,
    current_session_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_members (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('DM', 'player')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS campaign_events (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(60) NOT NULL,
    content JSONB,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    session_summary TEXT,
    narration_log JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_maps (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    image_url TEXT NOT NULL,
    grid_enabled BOOLEAN DEFAULT FALSE,
    grid_size INTEGER,
    reveal_state JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'campaigns_active_map_id_fkey'
    ) THEN
        ALTER TABLE campaigns
            ADD CONSTRAINT campaigns_active_map_id_fkey
            FOREIGN KEY (active_map_id)
            REFERENCES campaign_maps(id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS map_tokens (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    map_id INTEGER REFERENCES campaign_maps(id) ON DELETE CASCADE,
    token_type VARCHAR(20) NOT NULL CHECK (token_type IN ('player', 'enemy', 'npc', 'boss')),
    label VARCHAR(120),
    hp_current INTEGER,
    hp_max INTEGER,
    position JSONB NOT NULL,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dice_rolls (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dice_type VARCHAR(8) NOT NULL,
    rolls JSONB NOT NULL,
    result INTEGER NOT NULL,
    modifier INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    advantage_state VARCHAR(20) DEFAULT 'normal',
    context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_world_events (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    status VARCHAR(40) DEFAULT 'active',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_quests (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    status VARCHAR(40) DEFAULT 'active',
    progress JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_memories (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    key_facts JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
