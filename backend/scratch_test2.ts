import { getUserCampaigns, createCampaign } from './src/services/campaignService';
import { supabase } from './src/config/db';

async function test() {
    try {
        // Create user 9999
        await supabase.from('users').upsert([{ id: 9999, email: 'test9999@test.com', display_name: 'test', password_hash: '123' }]);

        // Create a campaign for 9999
        await createCampaign({
            name: "Test Campaign",
            dmUserId: 9999
        });

        const campaigns = await getUserCampaigns(9999);
        console.log("Campaigns for user 9999:", campaigns.length);

    } catch (err) {
        console.error(err);
    }
}

test().then(() => process.exit());
