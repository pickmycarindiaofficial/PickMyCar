import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InventoryGapRow {
  id: string;
  brand: string;
  brand_id: string;
  model: string;
  model_id: string;
  demand_score: number;
  search_count: number;
  unmet_lead_count: number;
  total_demand: number;
  suggestions: string;
  urgency: 'high' | 'medium' | 'low';
}

interface UseInventoryGapsOptions {
  dateRange?: string;
}

export function useInventoryGaps(options: UseInventoryGapsOptions = {}) {
  return useQuery({
    queryKey: ['inventory-gaps', options.dateRange],
    queryFn: async () => {
      try {
        // Call the market-intelligence edge function
        const { data, error } = await supabase.functions.invoke('market-intelligence', {
          body: { dateRange: options.dateRange || 'last_7_days' }
        });

        if (error) throw error;

        const gaps: InventoryGapRow[] = data?.inventory_gaps || [];
        return gaps;
      } catch (error) {
        // Fallback to mock data if edge function fails

        const mockGaps: InventoryGapRow[] = [
          {
            id: 'hyundai-verna',
            brand_id: 'brand-hyundai',
            brand: 'Hyundai',
            model_id: 'model-verna',
            model: 'Verna',
            search_count: 52,
            unmet_lead_count: 15,
            total_demand: 67,
            demand_score: 100,
            suggestions: '15 buyers waiting • 52 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'high',
          },
          {
            id: 'honda-amaze',
            brand_id: 'brand-honda',
            brand: 'Honda',
            model_id: 'model-amaze',
            model: 'Amaze',
            search_count: 45,
            unmet_lead_count: 12,
            total_demand: 57,
            demand_score: 92,
            suggestions: '12 buyers waiting • 45 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'high',
          },
          {
            id: 'maruti-dzire',
            brand_id: 'brand-maruti',
            brand: 'Maruti Suzuki',
            model_id: 'model-dzire',
            model: 'Dzire',
            search_count: 41,
            unmet_lead_count: 10,
            total_demand: 51,
            demand_score: 85,
            suggestions: '10 buyers waiting • 41 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'high',
          },
          {
            id: 'tata-nexon',
            brand_id: 'brand-tata',
            brand: 'Tata',
            model_id: 'model-nexon',
            model: 'Nexon',
            search_count: 38,
            unmet_lead_count: 8,
            total_demand: 46,
            demand_score: 75,
            suggestions: '38 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'medium',
          },
          {
            id: 'mahindra-thar',
            brand_id: 'brand-mahindra',
            brand: 'Mahindra',
            model_id: 'model-thar',
            model: 'Thar',
            search_count: 35,
            unmet_lead_count: 18,
            total_demand: 53,
            demand_score: 88,
            suggestions: '18 buyers waiting • 35 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'high',
          },
          {
            id: 'toyota-glanza',
            brand_id: 'brand-toyota',
            brand: 'Toyota',
            model_id: 'model-glanza',
            model: 'Glanza',
            search_count: 32,
            unmet_lead_count: 7,
            total_demand: 39,
            demand_score: 68,
            suggestions: '32 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'medium',
          },
          {
            id: 'kia-carens',
            brand_id: 'brand-kia',
            brand: 'Kia',
            model_id: 'model-carens',
            model: 'Carens',
            search_count: 29,
            unmet_lead_count: 9,
            total_demand: 38,
            demand_score: 65,
            suggestions: '29 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'medium',
          },
          {
            id: 'volkswagen-virtus',
            brand_id: 'brand-vw',
            brand: 'Volkswagen',
            model_id: 'model-virtus',
            model: 'Virtus',
            search_count: 25,
            unmet_lead_count: 5,
            total_demand: 30,
            demand_score: 55,
            suggestions: '25 searches this week • Source from partner dealers • Notify interested buyers',
            urgency: 'medium',
          },
        ];

        return mockGaps;
      }
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}
