import { getUserCampaigns } from './src/services/campaignService';
import { supabase } from './src/config/db';

async function test() {
    try {
        const campaigns = await getUserCampaigns(1); // Test user 1
        console.log("Campaigns for user 1:", campaigns.length);
        
        // Also let's try just getting all campaigns to see
        const { data } = await supabase.from('campaigns').select('*');
        console.log("Total campaigns:", data?.length);

    } catch (err) {
        console.error(err);
    }
}

test().then(() => process.exit());
