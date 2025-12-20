import { createClient } from '@supabase/supabase-js';

// NOTE: Hardcoded to false for local development and feature verification as requested.
// To re-enable cloud database, set this to true and provide valid environment variables.
export const isSupabaseConfigured = false;

const SUPABASE_URL = 'https://xyzcompany.supabase.co';
const SUPABASE_KEY = 'public-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
