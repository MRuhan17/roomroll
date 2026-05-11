CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    class_name VARCHAR(120),
    species VARCHAR(120),
    background VARCHAR(120),
    backstory TEXT,
    is_npc BOOLEAN DEFAULT FALSE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    ability_scores JSONB NOT NULL DEFAULT '{
        "strength": 10,
        "dexterity": 10,
        "constitution": 10,
        "intelligence": 10,
        "wisdom": 10,
        "charisma": 10
    }'::jsonb,
    combat_stats JSONB NOT NULL DEFAULT '{
        "hp_current": 10,
        "hp_max": 10,
        "armor_class": 10,
        "speed": 30,
        "proficiency_bonus": 2
    }'::jsonb,
    progression_state JSONB NOT NULL DEFAULT '{
        "milestones": [],
        "talents": [],
        "notes": []
    }'::jsonb,
    currency JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);

CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    item_type VARCHAR(40) NOT NULL DEFAULT 'misc'
        CHECK (item_type IN ('weapon', 'armor', 'consumable', 'tool', 'quest', 'misc')),
    rarity VARCHAR(40),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    weight NUMERIC(10, 2),
    stackable BOOLEAN DEFAULT TRUE,
    equippable BOOLEAN DEFAULT FALSE,
    item_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_character_id ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_campaign_id ON inventory_items(campaign_id);

CREATE TABLE IF NOT EXISTS character_equipment (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    inventory_item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    slot VARCHAR(40) NOT NULL
        CHECK (slot IN ('head', 'chest', 'legs', 'feet', 'hands', 'weapon', 'offhand', 'accessory')),
    equipped_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (character_id, slot),
    UNIQUE (inventory_item_id)
);

CREATE INDEX IF NOT EXISTS idx_character_equipment_character_id ON character_equipment(character_id);

CREATE TABLE IF NOT EXISTS character_status_effects (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    name VARCHAR(160) NOT NULL,
    effect_type VARCHAR(40) NOT NULL
        CHECK (effect_type IN ('buff', 'debuff', 'condition', 'neutral')),
    source VARCHAR(160),
    duration_type VARCHAR(40) NOT NULL DEFAULT 'permanent'
        CHECK (duration_type IN ('rounds', 'turns', 'time', 'permanent')),
    duration_value INTEGER,
    remaining_duration INTEGER,
    modifiers JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    removed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_character_status_effects_character_id ON character_status_effects(character_id);
CREATE INDEX IF NOT EXISTS idx_character_status_effects_campaign_id ON character_status_effects(campaign_id);

CREATE TABLE IF NOT EXISTS character_progression_log (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    change_type VARCHAR(40) NOT NULL
        CHECK (change_type IN ('xp_gain', 'xp_loss', 'level_up', 'level_down', 'milestone', 'respec')),
    amount INTEGER NOT NULL DEFAULT 0,
    previous_xp INTEGER NOT NULL DEFAULT 0,
    new_xp INTEGER NOT NULL DEFAULT 0,
    previous_level INTEGER NOT NULL DEFAULT 1,
    new_level INTEGER NOT NULL DEFAULT 1,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_progression_log_character_id ON character_progression_log(character_id);
CREATE INDEX IF NOT EXISTS idx_character_progression_log_campaign_id ON character_progression_log(campaign_id);
