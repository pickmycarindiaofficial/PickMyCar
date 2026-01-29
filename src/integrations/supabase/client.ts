import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config, validateConfig } from '@/lib/config';

// Validate configuration on initialization
// This ensures that the application fails early if VITE_SUPABASE keys are missing
validateConfig();

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);