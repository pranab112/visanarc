import { createClient } from '@supabase/supabase-js';

/**
 * --- AGENCY INFRASTRUCTURE (Shared with Team/Manager) ---
 * Project: pfypcdorczjbzmainozl
 */
export const AGENCY_URL: string = 'https://pfypcdorczjbzmainozl.supabase.co'; 
export const AGENCY_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmeXBjZG9yY3pqYnptYWlub3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MDU5NzUsImV4cCI6MjA4MTk4MTk3NX0.jfl0-AbCjONMTEMdIK8lSPQ9EUPgVSnI2Jr0nrOz13s';

/**
 * --- OWNER SECURITY LAYER (Private to you) ---
 * Project: vnvkoljuiydnpksxgyls
 */
export const MASTER_URL: string = 'https://vnvkoljuiydnpksxgyls.supabase.co'; 
export const MASTER_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudmtvbGp1aXlkbnBrc3hneWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDgwNDMsImV4cCI6MjA4MjIyNDA0M30.st6MRlpAhJlSZHBppLFPCFyiWhlEkhHNou81b02nDTM';

export const isSupabaseConfigured = AGENCY_URL.startsWith('https://') && !AGENCY_URL.includes('YOUR_PROJECT_ID');

// 1. Primary Agency Client (CRM Operations)
export const supabase = createClient(
    isSupabaseConfigured ? AGENCY_URL : 'https://placeholder.supabase.co', 
    isSupabaseConfigured ? AGENCY_KEY : 'placeholder-key'
);

// 2. Master Security Client (Licensing & Sales Audit)
export const gtdevsHQ = createClient(
    MASTER_URL,
    MASTER_KEY
);