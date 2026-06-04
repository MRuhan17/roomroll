import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.JWT_SECRET || '';

const adminClient = createClient(supabaseUrl, serviceRoleKey);

function getClientForUser(id: number, email: string) {
    const token = jwt.sign(
        { id, email, role: 'authenticated', sub: String(id), iat: Math.floor(Date.now() / 1000) - 31536000 },
        jwtSecret,
        { expiresIn: '5y' }
    );
    return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || serviceRoleKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
}

function getAnonClient() {
    return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || serviceRoleKey);
}

async function runAudit() {
    console.log("=== Setting up Test Data ===");
    
    // Create Users
    const users = [
        { email: 'user_a_dm@test.com', password_hash: 'hash', display_name: 'DM' },
        { email: 'user_b_member@test.com', password_hash: 'hash', display_name: 'Member' },
        { email: 'user_c_hacker@test.com', password_hash: 'hash', display_name: 'Hacker' }
    ];

    const userIds = [];
    for (const u of users) {
        const { data, error } = await adminClient.from('users').upsert(u, { onConflict: 'email' }).select('id').single();
        if (error) { console.log(error); process.exit(1); }
        userIds.push(data.id);
    }
    const [dmId, memberId, hackerId] = userIds;

    // Create Campaign
    let campaignId = -1;
    const { data: existingCamp } = await adminClient.from('campaigns').select('id').eq('invite_code', 'AUDIT123').single();
    if (existingCamp) {
        campaignId = existingCamp.id;
    } else {
        const { data: camp, error: cErr } = await adminClient.from('campaigns').insert({
            name: 'Audit Campaign',
            dm_user_id: dmId,
            invite_code: 'AUDIT123'
        }).select('id').single();
        if (cErr) { console.log("Camp Err:", cErr); process.exit(1); }
        campaignId = camp.id;
    }

    // Create Participant
    await adminClient.from('campaign_participants').upsert({
        campaign_id: campaignId,
        user_id: memberId,
        role: 'player'
    });

    // Create Maps and Characters
    await adminClient.from('campaign_maps').upsert({ campaign_id: campaignId, name: 'Audit Map', image_url: 'url' });
    await adminClient.from('characters').upsert({ campaign_id: campaignId, user_id: memberId, name: 'Member Char' });

    console.log(`Test Data Created. DM: ${dmId}, Member: ${memberId}, Hacker: ${hackerId}, Campaign: ${campaignId}`);

    const dmClient = getClientForUser(dmId, 'user_a_dm@test.com');
    const memberClient = getClientForUser(memberId, 'user_b_member@test.com');
    const hackerClient = getClientForUser(hackerId, 'user_c_hacker@test.com');
    const anonClient = getAnonClient();

    const clients = [
        { name: 'User A (DM)', client: dmClient },
        { name: 'User B (Member)', client: memberClient },
        { name: 'User C (Hacker)', client: hackerClient },
        { name: 'User D (Anon/Missing JWT)', client: anonClient }
    ];

    const tables = ['campaigns', 'campaign_maps', 'characters', 'campaign_participants'];

    console.log("\n=== Running Audit Queries ===\n");
    for (const table of tables) {
        console.log(`--- Testing Table: ${table} ---`);
        for (const { name, client } of clients) {
            const { data, error } = await client.from(table).select('*').eq('campaign_id', table === 'campaigns' ? campaignId : campaignId);
            
            // For campaigns table, we just filter by id
            const actualData = table === 'campaigns' ? await client.from(table).select('*').eq('id', campaignId) : { data, error };
            
            if (actualData.error) {
                console.log(`[${name}] Error:`, actualData.error.message);
            } else {
                const allowed = actualData.data && actualData.data.length > 0;
                console.log(`[${name}] Access: ${allowed ? 'ALLOWED (Data Returned)' : 'DENIED (Empty/Hidden)'}`);
            }
        }
        console.log("");
    }
}

runAudit().then(() => process.exit(0));
