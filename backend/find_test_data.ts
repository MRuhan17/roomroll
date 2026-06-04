import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function findTestData() {
    const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

    // Find a campaign that has at least one participant who is not the DM
    const { data: campaigns, error: campErr } = await supabase
        .from('campaigns')
        .select(`
            id, 
            dm_user_id,
            campaign_participants ( user_id )
        `)
        .limit(10);

    if (campErr) {
        console.error("Error fetching campaigns:", campErr);
        return;
    }

    let targetCampaign = null;
    let memberUserId = null;

    for (const camp of campaigns) {
        if (camp.campaign_participants && camp.campaign_participants.length > 0) {
            const member = camp.campaign_participants.find((p: any) => p.user_id !== camp.dm_user_id);
            if (member) {
                targetCampaign = camp;
                memberUserId = member.user_id;
                break;
            }
        }
    }

    if (!targetCampaign) {
        console.log("No campaigns with members found. Will create mock users for testing.");
        return;
    }

    console.log(JSON.stringify({
        campaignId: targetCampaign.id,
        dmId: targetCampaign.dm_user_id,
        memberId: memberUserId
    }, null, 2));
}

findTestData().then(() => process.exit(0));
