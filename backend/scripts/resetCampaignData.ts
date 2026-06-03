import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

for (const key in process.env) {
    const value = process.env[key];
    if (typeof value === 'string') {
        process.env[key] = value.trim().replace(/^[`'"]|[`'"]$/g, '').trim();
    }
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
});

const campaignScopedTables = [
    'character_status_effects',
    'character_equipment',
    'inventory_items',
    'character_progression_log',
    'characters',
    'dice_rolls',
    'map_tokens',
    'campaign_maps',
    'campaign_events',
    'campaign_world_events',
    'campaign_quests',
    'campaign_memories',
    'session_logs',
    'campaign_participants',
    'campaigns'
];

async function clearTable(table: string) {
    const { error } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null);

    if (error) {
        throw new Error(`Failed to clear ${table}: ${error.message}`);
    }

    console.log(`Cleared ${table}`);
}

async function main() {
    console.log('Resetting all campaign data for all users...');

    for (const table of campaignScopedTables) {
        await clearTable(table);
    }

    console.log('Campaign data reset complete.');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
