import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createLogger } from '../lib/logger';

dotenv.config();

const logger = createLogger('database');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
}

logger.info('Supabase client initialized');

export const supabase = createClient(supabaseUrl, supabaseKey);
