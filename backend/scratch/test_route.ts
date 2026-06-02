import dotenv from 'dotenv';
dotenv.config();

// Clean environment variables
for (const key in process.env) {
    const val = process.env[key];
    if (typeof val === 'string') {
        process.env[key] = val.trim().replace(/^[\`\'\"]|[\`\'\"]$/g, '').trim();
    }
}

import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || 'RoomRoll_9xK29@LegendarySecret_2026';
const token = jwt.sign({ id: 2, email: 'ruhanmulla07@gmail.com' }, jwtSecret, { expiresIn: '1h' });

async function run() {
    console.log('Testing /api/campaigns endpoint with valid auth token...');
    try {
        const response = await request(app)
            .post('/api/campaigns')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'My Epic Saga',
                description: 'A great journey',
                worldType: 'Classic Fantasy'
            });

        console.log('Status Code:', response.statusCode);
        console.log('Response Body:', JSON.stringify(response.body, null, 2));
    } catch (err) {
        console.error('Supertest error:', err);
    }
}

run();
