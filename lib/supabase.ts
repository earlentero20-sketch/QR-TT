import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// A standalone build can be missing EAS environment variables. Supabase throws
// during module initialization when either value is empty, which closes the
// app before React can display an error. Keep startup alive and let the root
// screen explain how to fix the build configuration.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
    supabaseUrl || 'https://missing-project.supabase.co',
    supabaseAnonKey || 'missing-anon-key',
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
            flowType: 'pkce',
        },
    }
);
