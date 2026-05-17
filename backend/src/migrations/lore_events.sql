CREATE TABLE IF NOT EXISTS campaign_lore_entries (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    category VARCHAR(60) DEFAULT 'general',
    content TEXT NOT NULL,
    is_secret BOOLEAN DEFAULT FALSE,
    is_discovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_factions (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    leader VARCHAR(120),
    relationships JSONB DEFAULT '{}'::jsonb,
    is_discovered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_discoveries (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    entity_type VARCHAR(60) NOT NULL CHECK (entity_type IN ('lore', 'faction', 'event')),
    entity_id INTEGER NOT NULL,
    discovered_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW()
);
