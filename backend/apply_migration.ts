import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function applyMigration() {
    console.log("Applying Migration...");
    
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    const adminSupabase = createClient(supabaseUrl, serviceKey);
    
    const migrationSql = fs.readFileSync(path.resolve(__dirname, 'src/migrations/compliance_tracking.sql'), 'utf-8');
    
    const { error } = await adminSupabase.rpc('exec_sql', { query: migrationSql });
    
    if (error) {
        console.error("RPC exec_sql failed. Trying direct query if possible, or we may need to connect directly to postgres.");
        console.error(error);
        console.log("We don't have exec_sql. We need to create it or use another method to execute SQL.");
    } else {
        console.log("Migration applied successfully!");
    }
}

applyMigration().then(() => process.exit());
