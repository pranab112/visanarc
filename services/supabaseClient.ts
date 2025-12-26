
import { createClient } from '@supabase/supabase-js';

// Supabase credentials are now sourced from environment variables.
// Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.
export const AGENCY_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const AGENCY_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = AGENCY_URL.startsWith('https://') && AGENCY_KEY.length > 0;

// Primary Agency Client for all CRM operations. 
// If keys are missing, the app will gracefully degrade to 'Local Mode' using localStorage.
export const supabase = createClient(
    isSupabaseConfigured ? AGENCY_URL : 'https://placeholder.supabase.co', 
    isSupabaseConfigured ? AGENCY_KEY : 'placeholder-key'
);

// Note: Master Security Client (gtdevsHQ) logic has been fully purged.
