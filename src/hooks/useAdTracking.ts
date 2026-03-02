/**
 * useAdTracking — React hook for SPA ad tracking + DB visitor recording
 * =======================================================================
 * 1. Fires pageView() to Meta Pixel + Google Ads on every route change.
 * 2. Silently inserts a row into the `page_views` Supabase table so
 *    PowerDesk can display real visitor stats with date-range filtering.
 *
 * Both operations are fire-and-forget — failures are silently swallowed
 * so a DB error never blocks navigation.
 *
 * USAGE:
 *   <AdTrackingInit /> is rendered inside <BrowserRouter> in App.tsx
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';
import { supabase } from '@/integrations/supabase/client';

/** Persistent session ID — stable for the browser tab lifetime. */
function getSessionId(): string {
    const KEY = 'pmc_session_id';
    try {
        let id = sessionStorage.getItem(KEY);
        if (!id) {
            id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
            sessionStorage.setItem(KEY, id);
        }
        return id;
    } catch {
        return Math.random().toString(36).slice(2);
    }
}

/** Detect device type from user-agent */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
}

/**
 * Hook that auto-fires pageView on every route change.
 * Must be used inside a <BrowserRouter>.
 */
export function useAdTracking() {
    const location = useLocation();
    const isInitialized = useRef(false);

    // Initialize analytics once
    useEffect(() => {
        if (!isInitialized.current) {
            analytics.init();
            isInitialized.current = true;
        }
    }, []);

    // Fire pageView on every route change — ad platforms + DB
    useEffect(() => {
        const path = location.pathname + location.search;

        // 1. Meta Pixel + Google Ads (existing behaviour)
        analytics.pageView(path);

        // 2. Write to page_views table for PowerDesk Visitor Analytics
        //    Fire-and-forget: any error is silently ignored.
        void (async () => {
            try {
                await (supabase as any).from('page_views').insert({
                    session_id: getSessionId(),
                    path,
                    referrer: document.referrer || null,
                    device_type: getDeviceType(),
                    // user_id is omitted here — Supabase will set it via RLS/auth context
                    // if the user is logged in. Anonymous visits are still tracked.
                });
            } catch {
                // Never block navigation
            }
        })();
    }, [location.pathname, location.search]);

    return analytics;
}

export default useAdTracking;
