/**
 * Enterprise Logger - Production-safe logging utility
 * 
 * This module provides a centralized logging system that:
 * - Only logs in development mode
 * - Integrates with Sentry for production error tracking
 * - Provides structured log levels
 */

import { captureMessage, captureError } from './sentry';

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    /** Additional context to include */
    context?: Record<string, unknown>;
    /** Whether to send to Sentry (only for warn/error) */
    reportToSentry?: boolean;
}

/**
 * Development-only console logger
 * These logs are stripped in production builds
 */
export const logger = {
    /**
     * Debug level - development only
     */
    debug: (message: string, data?: unknown) => {
        if (isDev) {
            console.log(`🔍 [DEBUG] ${message}`, data ?? '');
        }
    },

    /**
     * Info level - development only
     */
    info: (message: string, data?: unknown) => {
        if (isDev) {
            console.log(`ℹ️ [INFO] ${message}`, data ?? '');
        }
    },

    /**
     * Warning level - logs in dev, reports to Sentry in prod
     */
    warn: (message: string, options?: LogOptions) => {
        if (isDev) {
            console.warn(`⚠️ [WARN] ${message}`, options?.context ?? '');
        } else if (options?.reportToSentry) {
            captureMessage(message, 'warning');
        }
    },

    /**
     * Error level - always reports to Sentry in prod
     */
    error: (message: string, error?: Error, options?: LogOptions) => {
        if (isDev) {
            console.error(`❌ [ERROR] ${message}`, error, options?.context ?? '');
        } else {
            captureError(error || new Error(message));
        }
    },

    /**
     * Performance timing - development only
     */
    time: (label: string) => {
        if (isDev) {
            console.time(`⏱️ ${label}`);
        }
    },

    timeEnd: (label: string) => {
        if (isDev) {
            console.timeEnd(`⏱️ ${label}`);
        }
    },
};

export default logger;
