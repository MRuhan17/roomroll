import dotenv from 'dotenv';
dotenv.config();

// Clean environment variables
for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[\`\'\"]|[\`\'\"]$/g, '').trim();
    }
}

import { createCampaign } from '../src/services/campaignService';

async function run() {
    console.log('Testing createCampaign...');
    try {
        const campaign = await createCampaign({
            name: 'Test Campaign From Script',
            description: 'A test campaign',
            worldType: 'Classic Fantasy',
            dmUserId: 2,
            playMode: 'human_dm'
        });
        console.log('Campaign created successfully:', campaign);
    } catch (e: any) {
        console.error('Error creating campaign:', e);
        if (e && typeof e === 'object') {
            console.error('Error keys:', Object.keys(e));
            console.error('Error message:', e.message);
            console.error('Error details:', e.details);
            console.error('Error hint:', e.hint);
            console.error('Error code:', e.code);
        }
    }
}

run();
