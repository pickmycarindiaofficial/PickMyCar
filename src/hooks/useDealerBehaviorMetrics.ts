import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export interface DealerMetrics {
  dealer_id: string;
  dealer_name?: string;
  total_leads_received: number;
  leads_responded: number;
  leads_converted: number;
  response_rate: number;
  conversion_rate: number;
  avg_response_time_minutes: number;
  quality_score: number;
  reliability_score: number;
  fastest_response_minutes: number;
  slowest_response_minutes: number;
  streak_days: number;
  best_response_hour: number;
  best_response_day: string;
  last_response_at: string;
}

export function useDealerBehaviorMetrics(dealerId?: string) {
  const { user } = useAuth();
  const targetDealerId = dealerId || user?.id;

  return useQuery({
    queryKey: ['dealer-behavior-metrics', targetDealerId],
    queryFn: async () => {
      try {
        let query = (supabase as any)
          .from('dealer_behavior_metrics')
          .select('*')
          .is('period_end', null);

        if (targetDealerId) {
          query = query.eq('dealer_id', targetDealerId);
        }

        const { data, error } = await query as any;

        if (error) {
          console.warn('Error fetching dealer behavior metrics:', error);
          return { metrics: [], leaderboard: [] };
        }

        const metrics: DealerMetrics[] = (data || []).map((m: any) => ({
          dealer_id: m.dealer_id,
          dealer_name: m.dealer_name || 'Dealer',
          total_leads_received: m.total_leads_received || 0,
          leads_responded: m.leads_responded || 0,
          leads_converted: m.leads_converted || 0,
          response_rate: m.response_rate || 0,
          conversion_rate: m.conversion_rate || 0,
          avg_response_time_minutes: m.avg_response_time_minutes || 0,
          quality_score: m.quality_score || 0,
          reliability_score: m.reliability_score || 0,
          fastest_response_minutes: m.fastest_response_minutes || 0,
          slowest_response_minutes: m.slowest_response_minutes || 0,
          streak_days: m.streak_days || 0,
          best_response_hour: m.best_response_hour,
          best_response_day: m.best_response_day,
          last_response_at: m.last_response_at
        }));

        const leaderboard = [...metrics].sort((a, b) => b.quality_score - a.quality_score);

        return { metrics: targetDealerId ? metrics[0] : metrics, leaderboard };
      } catch (err) {
        console.warn('Error in dealer behavior metrics:', err);
        return { metrics: [], leaderboard: [] };
      }
    },
    refetchInterval: 30000,
    enabled: !!targetDealerId
  });
}

