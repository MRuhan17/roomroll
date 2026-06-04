import request from 'supertest';
import app from './src/app';
import jwt from 'jsonwebtoken';
import { supabase } from './src/config/db';

async function runAudit() {
    console.log("Starting Security Audit...");
    try {
        // 1. Setup Users
        const userA = { id: 9001, email: 'dm@test.com', display_name: 'DM', password_hash: '123' };
        const userB = { id: 9002, email: 'hacker@test.com', display_name: 'Hacker', password_hash: '123' };
        await supabase.from('users').upsert([userA, userB]);

        // 2. Setup Campaign by User A
        const { data: campaign } = await supabase.from('campaigns').insert([{
            name: 'Audit Campaign',
            dm_user_id: userA.id,
            invite_code: 'AUDIT123',
        }]).select('id').single();
        const campaignId = campaign.id;

        await supabase.from('campaign_participants').insert([{
            campaign_id: campaignId,
            user_id: userA.id,
            role: 'DM'
        }]);

        // 3. Generate Hacker Token
        const tokenB = jwt.sign(
            { id: userB.id, email: userB.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        const headers = { Authorization: `Bearer ${tokenB}` };
        console.log(`\nTesting Unauthorized Access for Campaign ID: ${campaignId}\n`);

        const endpoints = [
            { method: 'get', path: `/api/campaigns/${campaignId}`, name: 'Campaign Metadata' },
            { method: 'get', path: `/api/campaigns/${campaignId}/characters`, name: 'Characters/Tokens' },
            { method: 'get', path: `/api/campaigns/${campaignId}/maps`, name: 'Maps' },
            { method: 'get', path: `/api/campaigns/${campaignId}/world/lore`, name: 'World Data (Lore)' },
            { method: 'get', path: `/api/campaigns/${campaignId}/tavern`, name: 'Tavern (NPCs)' },
            { method: 'get', path: `/api/campaigns/${campaignId}/story-prep`, name: 'Story Prep (Quests/Memories)' }
        ];

        let allPassed = true;
        for (const ep of endpoints) {
            const res = await (request(app) as any)[ep.method](ep.path).set(headers);
            const passed = res.status === 403 || res.status === 401;
            console.log(`[${passed ? 'PASS' : 'FAIL'}] ${ep.name}`);
            console.log(`  Expected: 403 Forbidden | Got: ${res.status}`);
            if (!passed) allPassed = false;
        }

        console.log(`\nAudit Complete. All Passed: ${allPassed}`);
    } catch (err) {
        console.error("Audit failed to run", err);
    }
}

runAudit().then(() => process.exit());
