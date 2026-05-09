import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('[database]: Missing Supabase URL or Key in .env');
} else {
    console.log('[database]: Supabase client initialized');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
