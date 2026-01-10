import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface TimelineActivity {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface LearnedPreference {
  budget_range?: string;
  preferred_brands?: string[];
  preferred_body_types?: string[];
  financing_interest?: boolean;
}

export function useUserActivityTimeline(userId?: string) {
  return useQuery({
    queryKey: ['user-activity-timeline', userId],
    queryFn: async () => {
      if (!userId) return { activities: [], preferences: {} };

      // Fetch user events
      const { data: events, error: eventsError } = await (supabase as any)
        .from('user_events')
        .select('*')
        .eq('user_id', userId)
        .order('at', { ascending: false })
        .limit(20);

      if (eventsError) throw eventsError;

      // Transform events into timeline activities
      const activities: TimelineActivity[] = (events || []).map((event: any) => {
        let description = '';
        
        switch (event.event) {
          case 'view':
            description = `Viewed car listing`;
            break;
          case 'wishlist_add':
            description = `Saved car to favorites`;
            break;
          case 'contact_click':
            description = `Contacted dealer`;
            break;
          case 'filter_change':
            description = `Applied filters`;
            break;
          case 'exit_intent':
            description = `Exit intent detected`;
            break;
          case 'search':
            description = `Performed search`;
            break;
          case 'compare':
            description = `Compared cars`;
            break;
          default:
            description = event.event;
        }

        return {
          id: event.id,
          action: event.event,
          description,
          timestamp: event.at,
          metadata: event.meta
        };
      });

      // Fetch lead enrichment for learned preferences
      const { data: enrichment } = await (supabase as any)
        .from('lead_enrichment')
        .select('*')
        .eq('user_id', userId)
        .order('enriched_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const preferences: LearnedPreference = {
        budget_range: enrichment?.behavioral_signals?.budget_range,
        preferred_brands: enrichment?.behavioral_signals?.preferred_brands || [],
        preferred_body_types: enrichment?.behavioral_signals?.preferred_body_types || [],
        financing_interest: enrichment?.behavioral_signals?.financing_interest || false
      };

      return { activities, preferences };
    },
    enabled: !!userId,
    refetchInterval: 30000
  });
}
