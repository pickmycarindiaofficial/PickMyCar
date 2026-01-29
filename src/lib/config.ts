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

export const config: Config = {
    supabase: {
        url: getEnv('VITE_SUPABASE_URL', ''),
        anonKey: getEnv('VITE_SUPABASE_PUBLISHABLE_KEY', ''),
        projectId: getEnv('VITE_SUPABASE_PROJECT_ID', ''),
    },
    isProd: import.meta.env.PROD,
    isDev: import.meta.env.DEV,
    version: '2.1.0-prod',
};

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
