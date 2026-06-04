import request from 'supertest';
import app from './src/app';
import jwt from 'jsonwebtoken';
import { supabase } from './src/config/db';

async function test() {
    try {
        // Create user 8888
        await supabase.from('users').upsert([{ id: 8888, email: 'test8888@test.com', display_name: 'test', password_hash: '123' }]);

        const token = jwt.sign(
            { id: 8888, email: 'test8888@test.com' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        const res = await request(app)
            .get('/api/campaigns')
            .set('Authorization', `Bearer ${token}`);

        console.log("Status:", res.status);
        console.log("Response campaigns count:", res.body.campaigns?.length);
    } catch (err) {
        console.error(err);
    }
}

test().then(() => process.exit());
