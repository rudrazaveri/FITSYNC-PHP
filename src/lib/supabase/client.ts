// Supabase Browser Client Configuration
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.NEXT_PUBLIC_URL || 
    process.env.URL || 
    'https://fitsync-ai.supabase.co';
  const supabaseAnonKey = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_ANON_KEY || 
    'dummy_anon_key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
