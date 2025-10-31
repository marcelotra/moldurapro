import { createClient, SupabaseClient } from '@supabase/supabase-js';

// The Supabase client is initialized as null.
let supabase: SupabaseClient | null = null;
// The configuration flag is hardcoded to false.
// This forces the application to fall back to the mock API service,
// preventing a startup crash if environment variables are not available.
let isSupabaseConfigured = false;

console.warn("Application is running in mock mode. Supabase is not configured.");

export { supabase, isSupabaseConfigured };
