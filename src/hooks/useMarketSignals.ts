import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface MarketSignal {
  id: string;
  signal_type: string;
  entity_type: string;
  entity_name: string;
  metric_value: number;
  previous_value: number;
  change_percentage: number;
  trend_direction: 'up' | 'down' | 'stable';
  confidence_score: number;
  priority: number;
  detected_at: string;
  metadata: any;
}

export interface InventoryGap {
  id: string;
  brand: string;
  model?: string;
  demand_score: number;
  search_count: number;
  suggestions: string[];
  urgency: 'high' | 'medium' | 'low';
}

export function useMarketSignals() {
  return useQuery({
    queryKey: ['market-signals'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('market_signals')
        .select('*')
        .order('priority', { ascending: false })
        .order('detected_at', { ascending: false })
        .limit(50) as any;

      if (error) throw error;

      const signals: MarketSignal[] = (data || []).map(s => ({
        id: s.id,
        signal_type: s.signal_type,
        entity_type: s.entity_type,
        entity_name: s.entity_name,
        metric_value: s.metric_value,
        previous_value: s.previous_value || 0,
        change_percentage: s.change_percentage || 0,
        trend_direction: s.trend_direction,
        confidence_score: s.confidence_score || 0,
        priority: s.priority || 50,
        detected_at: s.detected_at,
        metadata: s.metadata || {}
      }));

      const trendingBrands = signals.filter(s => s.signal_type === 'trending_brand').slice(0, 5);
      const hotLocations = signals.filter(s => s.signal_type === 'hot_location').slice(0, 10);
      const inventoryGaps = signals.filter(s => s.signal_type === 'inventory_gap').slice(0, 5);

      // Enhanced inventory gaps with actionable data
      const enhancedGaps: InventoryGap[] = await Promise.all(
        inventoryGaps.map(async (gap) => {
          const searchCount = gap.metric_value;
          const demand_score = Math.min(100, (searchCount / 10) * 100);

          const suggestions = [
            `Contact dealers in nearby cities for ${gap.entity_name}`,
            `Set up alerts for incoming ${gap.entity_name} stock`,
            `Consider pre-booking options for high-demand variants`,
          ];

          let urgency: 'high' | 'medium' | 'low' = 'low';
          if (demand_score >= 70) urgency = 'high';
          else if (demand_score >= 40) urgency = 'medium';

          return {
            id: gap.id,
            brand: gap.entity_name.split(' ')[0] || gap.entity_name,
            model: gap.entity_name.split(' ').slice(1).join(' ') || undefined,
            demand_score: Math.round(demand_score),
            search_count: searchCount,
            suggestions,
            urgency,
          };
        })
      );

      return { signals, trendingBrands, hotLocations, inventoryGaps: enhancedGaps };
    },

    refetchInterval: 60000
  });
}
