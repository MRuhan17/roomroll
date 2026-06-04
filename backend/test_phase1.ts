import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

async function testPhase1() {
    console.log("=== Phase 1 Verification ===");
    
    const user = { id: 17, email: 'test@example.com' };
    const jwtSecret = process.env.JWT_SECRET || '';

    // Generate token matching the new format in authController but backdated to fix clock mismatch
    const token = jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            role: 'authenticated',
            sub: String(user.id),
            iat: Math.floor(Date.now() / 1000) - (3 * 365 * 24 * 60 * 60) // 3 years ago
        },
        jwtSecret,
        { expiresIn: '5y' }
    );

    console.log("1. New Token Decodes Correctly:");
    const decoded = jwt.decode(token);
    console.log(JSON.stringify(decoded, null, 2));

    const isValid = !!(decoded && typeof decoded === 'object' && decoded.id === 17 && decoded.role === 'authenticated' && decoded.sub === '17');
    console.log(`Payload valid: ${isValid}`);

    console.log("\n2. Test Supabase PostgREST Interpretation:");
    
    const supabaseUrl = process.env.SUPABASE_URL || '';
    
    // Create an anonymous client but pass the JWT in the header
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // fallback if anon key is missing
    const supabase = createClient(supabaseUrl, anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    console.log("Attempting to query campaigns...");
    const { data, error } = await supabase.from('campaigns').select('id').limit(1);
    
    if (error) {
        console.error("Supabase Query Error:", error);
    } else {
        console.log("Query Successful! RLS returned data:", data);
        console.log("Supabase successfully accepted the token.");
    }
}

testPhase1().then(() => process.exit());
