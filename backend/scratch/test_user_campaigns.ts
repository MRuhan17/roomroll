import dotenv from 'dotenv';
dotenv.config();

// Clean environment variables
for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[`'"]|[`'"]$/g, '').trim();
    }
}

import { getUserCampaigns, listMembers } from '../src/services/campaignService';
import { getCampaignSnapshot } from '../src/services/campaignStateService';
import { supabase } from '../src/config/db';

async function test() {
    console.log('--- TESTING CAMPAIGN SERVICE END-TO-END ---');
    try {
        const userId = 2; // Ruhan the Unbound
        console.log(`\n1. Fetching campaigns for userId: ${userId}...`);
        const campaigns = await getUserCampaigns(userId);
        console.log(`Successfully fetched ${campaigns.length} campaigns:`);
        console.log(JSON.stringify(campaigns, null, 2));

        for (const camp of campaigns) {
            console.log(`\n2. Enriching campaign ID: ${camp.id} (${camp.name})...`);
            
            console.log(`   a. Fetching members for campaign ${camp.id}...`);
            const members = await listMembers(camp.id);
            console.log(`   Successfully fetched ${members.length} members.`);

            console.log(`   b. Fetching snapshot for campaign ${camp.id}...`);
            const snapshot = await getCampaignSnapshot(camp.id);
            console.log(`   Successfully fetched snapshot. Recent events count: ${snapshot.recentEvents?.length ?? 0}`);
            
            const hostMember = members.find(m => m.role === 'DM');
            let hostName = 'Dungeon Master';
            if (hostMember) {
                const { data: hostUser } = await supabase
                    .from('users')
                    .select('display_name')
                    .eq('id', hostMember.user_id)
                    .maybeSingle();
                if (hostUser) {
                    hostName = hostUser.display_name;
                }
            }

            const enriched = {
                ...camp,
                playerCount: members.length,
                hostName,
                lastActivity: camp.last_played_at || snapshot.recentEvents?.[0]?.created_at || camp.created_at,
                activeSessionState: camp.current_session_state
            };
            console.log(`   Enriched campaign result:`, JSON.stringify(enriched, null, 2));
        }
        console.log('\n--- ALL SERVICE CHECKS PASSED SUCCESSFULLY ---');
    } catch (error) {
        console.error('Service test failed with error:', error);
    }
}

test();
