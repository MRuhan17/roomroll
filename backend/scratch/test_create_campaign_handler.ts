import dotenv from 'dotenv';
dotenv.config();

// Clean environment variables
for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[\`\'\"]|[\`\'\"]$/g, '').trim();
    }
}

import { createCampaignHandler } from '../src/controllers/campaignController';
import { Request, Response } from 'express';

const mockReq = {
    user: {
        id: 2,
        email: 'ruhanmulla07@gmail.com'
    },
    body: {
        name: 'My New Tale',
        description: 'Once upon a time...',
        worldType: 'Classic Fantasy'
    }
} as unknown as Request;

const mockRes = {
    status: function(code: number) {
        console.log('res.status called with:', code);
        return this;
    },
    json: function(data: any) {
        console.log('res.json called with data:', JSON.stringify(data, null, 2));
        return this;
    }
} as unknown as Response;

async function run() {
    console.log('Testing createCampaignHandler...');
    try {
        await createCampaignHandler(mockReq, mockRes);
    } catch (e) {
        console.error('Handler exception:', e);
    }
}

run();
