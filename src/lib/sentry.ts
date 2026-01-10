import * as Sentry from "@sentry/react";

/**
 * Initialize Sentry for error monitoring
 * Only runs in production to avoid noise during development
 * 
 * To use Sentry:
 * 1. Create a free account at https://sentry.io
 * 2. Create a new React project
 * 3. Copy your DSN and add it to your .env file as VITE_SENTRY_DSN
 * 4. Call initSentry() in your main.tsx before rendering the app
 */
export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    // Only initialize in production and if DSN is configured
    if (import.meta.env.PROD && dsn) {
        Sentry.init({
            dsn,
            environment: import.meta.env.MODE,

            // Performance Monitoring
            tracesSampleRate: 0.1, // 10% of transactions

            // Session Replay (optional)
            replaysSessionSampleRate: 0.1, // 10% of sessions
            replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

            // Release tracking (set during build)
            // release: import.meta.env.VITE_APP_VERSION,

            // Ignore common non-actionable errors
            ignoreErrors: [
                // Browser extension errors
                /^chrome-extension:\/\//,
                /^moz-extension:\/\//,
                // Network errors that aren't our fault
                'Network Error',
                'Failed to fetch',
                'Load failed',
                // User cancelled requests
                'AbortError',
                // Script errors from third-party scripts
                'Script error.',
            ],

            // Before send hook for additional filtering
            beforeSend(event, hint) {
                // Filter out events from development
                if (import.meta.env.DEV) {
                    return null;
                }

                // You can modify the event here before sending
                return event;
            },
        });

        console.log('Sentry initialized for production error monitoring');
    } else if (import.meta.env.DEV) {
        console.log('Sentry disabled in development mode');
    }
};

/**
 * Capture a custom error with additional context
 */
export const captureError = (
    error: Error,
    context?: Record<string, unknown>
) => {
    if (import.meta.env.PROD) {
        Sentry.captureException(error, {
            extra: context,
        });
    } else {
        console.error('Error captured:', error, context);
    }
};

/**
 * Capture a custom message/event
 */
export const captureMessage = (
    message: string,
    level: Sentry.SeverityLevel = 'info',
    context?: Record<string, unknown>
) => {
    if (import.meta.env.PROD) {
        Sentry.captureMessage(message, {
            level,
            extra: context,
        });
    } else {
        console.log(`[${level}] ${message}`, context);
    }
};

/**
 * Set user context for better error tracking
 */
export const setUser = (user: {
    id: string;
    email?: string;
    username?: string;
}) => {
    Sentry.setUser(user);
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
    Sentry.setUser(null);
};

export default { initSentry, captureError, captureMessage, setUser, clearUser };
