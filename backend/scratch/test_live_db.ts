import dotenv from 'dotenv';
dotenv.config();

// Clean environment variables
for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[`'"]|[`'"]$/g, '').trim();
    }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('URL:', supabaseUrl);
console.log('Has Key:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        console.log('\n--- 1. Testing user fetch ---');
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .limit(3);
        
        if (userError) {
            console.error('User Fetch Error:', userError);
        } else {
            console.log('Successfully fetched users:', users?.map(u => ({ id: u.id, email: u.email, display_name: u.display_name })));
        }

        console.log('\n--- 2. Testing campaign fetch ---');
        const { data: campaigns, error: campaignError } = await supabase
            .from('campaigns')
            .select('*')
            .limit(3);
        
        if (campaignError) {
            console.error('Campaign Fetch Error:', campaignError);
        } else {
            console.log('Successfully fetched campaigns:', campaigns?.map(c => ({ id: c.id, name: c.name })));
        }

        console.log('\n--- 3. Testing campaign_members join query ---');
        // Let's find one user who has campaigns
        const { data: members, error: memberError } = await supabase
            .from('campaign_participants')
            .select('*, campaigns(*)')
            .limit(3);

        if (memberError) {
            console.error('Campaign Members Join Error:', memberError);
        } else {
            console.log('Successfully fetched campaign members (joined with campaigns):', JSON.stringify(members, null, 2));
        }

        console.log('\n--- 4. Testing singular vs plural join ---');
        const { data: singularJoin, error: singularError } = await supabase
            .from('campaign_participants')
            .select('*, campaign(*)')
            .limit(1);
        
        if (singularError) {
            console.log('Singular join campaign(*) failed as expected or with error:', singularError.message);
        } else {
            console.log('Singular join campaign(*) succeeded!', JSON.stringify(singularJoin, null, 2));
        }
    } catch (e) {
        console.error('Uncaught Exception:', e);
    }
}

run();
