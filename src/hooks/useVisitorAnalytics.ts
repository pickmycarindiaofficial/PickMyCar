/**
 * useVisitorAnalytics
 * =====================
 * React Query hook that calls the `get_visitor_stats` Supabase RPC.
 * Returns aggregated visitor stats for any date range.
 *
 * USAGE:
 *   const { data, isLoading } = useVisitorAnalytics({ from: new Date('2025-01-01'), to: new Date() });
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface DailySeries {
    day: string;        // ISO date string: "2025-01-15"
    visitors: number;
    page_views: number;
}

export interface TopPage {
    path: string;
    views: number;
}

export interface VisitorStats {
    total_page_views: number;
    unique_visitors: number;
    logged_in_visitors: number;
    mobile_pct: number;
    desktop_pct: number;
    top_pages: TopPage[];
    daily_series: DailySeries[];
    prev_unique_visitors: number;
    prev_page_views: number;
}

export interface VisitorAnalyticsResult {
    stats: VisitorStats;
    /** % change in unique visitors vs. previous period */
    visitorChange: number;
    /** % change in page views vs. previous period */
    pageViewChange: number;
}

function computeChange(current: number, previous: number): number {
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

export function useVisitorAnalytics(dateRange: { from: Date; to: Date }) {
    const { from, to } = dateRange;

    return useQuery<VisitorAnalyticsResult>({
        queryKey: ['visitor_analytics', from.toISOString(), to.toISOString()],
        queryFn: async (): Promise<VisitorAnalyticsResult> => {
            // Supabase RPC call — goes through SECURITY DEFINER function
            const { data, error } = await (supabase as any).rpc('get_visitor_stats', {
                p_from: from.toISOString(),
                p_to: to.toISOString(),
            });

            if (error) throw error;

            const stats = data as VisitorStats;

            return {
                stats,
                visitorChange: computeChange(stats.unique_visitors, stats.prev_unique_visitors),
                pageViewChange: computeChange(stats.total_page_views, stats.prev_page_views),
            };
        },
        staleTime: 1000 * 60 * 5,   // 5-min cache — analytics need not be real-time
        gcTime: 1000 * 60 * 10,
        retry: 1,
        placeholderData: (prev) => prev, // keep showing previous data while refetching
    });
}
