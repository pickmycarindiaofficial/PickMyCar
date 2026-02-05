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
    },
    global: {
      fetch: async (url, options = {}) => {
        const headers = new Headers((options as RequestInit)?.headers);

        // Inject staff token if available
        const staffToken = sessionStorage.getItem('pmc_staff_token');
        if (staffToken) {
          // Dynamic import to avoid circular dependencies if any, 
          // though safe here as utils shouldn't depend on client
          const { hashToken } = await import('@/lib/auth-utils');
          const tokenHash = await hashToken(staffToken);
          headers.set('x-staff-token', tokenHash);
        }

        return fetch(url, {
          ...options,
          headers,
        });
      },
    }
  }
);