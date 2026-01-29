/**
 * Centralized Configuration Manager
 * Handles environment variables with typed fallbacks and professional logging.
 */

interface Config {
    supabase: {
        url: string;
        anonKey: string;
        projectId: string;
    };
    isProd: boolean;
    isDev: boolean;
    version: string;
}

const getEnv = (key: string, fallback: string): string => {
    const value = import.meta.env[key];
    if (!value && import.meta.env.DEV) {
        console.warn(`[Config] Missing environment variable: ${key}. Using fallback.`);
    }
    return value || fallback;
};

// Fallback values for development or if environment variables are missing
const FALLBACK_URL = 'https://tfmaotjdfpqtnsghdwnl.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM';

export const config: Config = {
    supabase: {
        url: getEnv('VITE_SUPABASE_URL', FALLBACK_URL),
        anonKey: getEnv('VITE_SUPABASE_PUBLISHABLE_KEY', FALLBACK_ANON_KEY),
        projectId: getEnv('VITE_SUPABASE_PROJECT_ID', 'tfmaotjdfpqtnsghdwnl'),
    },
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
    version: '2.1.0-prod-optimized',
};

// Log warning if fallback is used in production for security monitoring
if (config.isProd && (config.supabase.url === FALLBACK_URL)) {
    console.warn('[Security] Warning: Using fallback Supabase credentials in production. Ensure GitHub Secrets are configured correctly.');
}

/**
 * Validates critical configuration on startup
 */
export const validateConfig = () => {
    const { url, anonKey } = config.supabase;
    if (!url || !anonKey || url.includes('placeholder')) {
        console.error('[Config] Critical Configuration Error: Supabase credentials are missing or invalid.');
        return false;
    }
    return true;
};

export default config;
