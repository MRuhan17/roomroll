import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testCustomJwt() {
    console.log("Testing Custom JWT Claims...");

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || '';

    if (!supabaseUrl || !jwtSecret) {
        console.error("Missing SUPABASE_URL or JWT_SECRET");
        return;
    }

    // 1. Create a custom JWT matching RoomRoll's format
    const customPayload = {
        id: 9999,
        email: 'test9999@example.com',
        role: 'authenticated' // Needed for Supabase PostgREST to allow the request
    };

    const token = jwt.sign(customPayload, jwtSecret, { expiresIn: '1h' });
    console.log("Generated JWT:", token);

    // 2. Initialize Supabase Client with this custom token
    const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || '', {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });

    // 3. To test current_setting, let's just query a table where we can read the error or maybe we can create a quick RPC function?
    // Since we can't easily create an RPC from the client without admin, we'll try to insert a row into a temp table or just query a table with a test RLS policy.
    // Or we can use `supabase.rpc` if an RPC exists. Let's see if we can do a simple select that we know will fail or succeed based on RLS.
    // Actually, we can just create a temporary policy using the service role, then test.
    
    const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    
    // Create an RPC to return claims
    await adminSupabase.rpc('create_test_rpc').catch(() => {});
    
    const { data: sqlData, error: sqlError } = await adminSupabase.rpc('exec_sql', {
        query: `
        CREATE OR REPLACE FUNCTION test_get_jwt_claims() RETURNS jsonb AS $$
        BEGIN
            RETURN current_setting('request.jwt.claims', true)::jsonb;
        END;
        $$ LANGUAGE plpgsql SECURITY INVOKER;
        `
    });

    if (sqlError) {
        console.log("Could not create RPC, maybe we don't have exec_sql. Error:", sqlError);
    }

    const { data: claims, error: claimsError } = await supabase.rpc('test_get_jwt_claims');
    
    if (claimsError) {
        console.error("RPC Error:", claimsError);
    } else {
        console.log("Returned Claims from Supabase:", claims);
    }
}

testCustomJwt().then(() => process.exit());
