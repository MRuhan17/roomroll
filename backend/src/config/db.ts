console.log('[DB] LOADING DB CONFIG...');
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createLogger } from '../lib/logger';

console.log('[DB] DOTENV CONFIG...');
dotenv.config();

const logger = createLogger('database');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
}

let client: any;

console.log('[DB] SUPABASE_URL:', supabaseUrl, '(length:', supabaseUrl.length, ')');
console.log('[DB] HAS_KEY:', !!supabaseKey, '(length:', supabaseKey?.length, ')');
if (supabaseUrl) console.log('[DB] URL_START:', supabaseUrl.substring(0, 10), 'URL_END:', supabaseUrl.substring(supabaseUrl.length - 5));

try {
    console.log('[DB] Creating Supabase client...');
    client = createClient(supabaseUrl, supabaseKey);
    console.log('[DB] Supabase client created.');
} catch (error) {
    console.error('[DB] ERROR:', error);
    throw error;
}

export const supabase = client;
