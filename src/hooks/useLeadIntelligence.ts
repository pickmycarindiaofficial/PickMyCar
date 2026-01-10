import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface LeadIntelligenceStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
  immediateBuyers: number;
  qualityTrend: 'improving' | 'stable' | 'declining';
}

export interface TopLead {
  id: string;
  user_id: string;
  car_listing_id: string;
  ai_score: number;
  intent_level: string;
  buying_timeline: string;
  conversion_probability: number;
  recommended_actions: any[];
  user_name?: string;
  car_name?: string;
  enriched_at: string;
}

export interface LeadsByTimeline {
  timeline: string;
  count: number;
  avgScore: number;
  conversionRate: number;
}

export function useLeadIntelligence() {
  return useQuery({
    queryKey: ['lead-intelligence'],
    queryFn: async () => {
      const { data: enrichments, error } = await (supabase as any)
        .from('lead_enrichment')
        .select(`
          *,
          user:user_id(full_name),
          car:car_listing_id(brand:brand_id(name), model:model_id(name))
        `)
        .order('ai_score', { ascending: false }) as any;

      if (error) throw error;

      const stats: LeadIntelligenceStats = {
        totalLeads: enrichments?.length || 0,
        hotLeads: enrichments?.filter(l => l.intent_level === 'hot').length || 0,
        warmLeads: enrichments?.filter(l => l.intent_level === 'warm').length || 0,
        coldLeads: enrichments?.filter(l => l.intent_level === 'cold').length || 0,
        averageScore: enrichments?.reduce((sum, l) => sum + (l.ai_score || 0), 0) / (enrichments?.length || 1),
        immediateBuyers: enrichments?.filter(l => l.buying_timeline === 'immediate').length || 0,
        qualityTrend: 'stable'
      };

      const topLeads: TopLead[] = (enrichments || []).slice(0, 20).map(e => ({
        id: e.id,
        user_id: e.user_id,
        car_listing_id: e.car_listing_id,
        ai_score: e.ai_score,
        intent_level: e.intent_level,
        buying_timeline: e.buying_timeline,
        conversion_probability: e.conversion_probability,
        recommended_actions: e.recommended_actions || [],
        user_name: e.user?.full_name,
        car_name: e.car ? `${e.car.brand?.name} ${e.car.model?.name}` : 'Unknown',
        enriched_at: e.enriched_at
      }));

      const timelineData: LeadsByTimeline[] = [
        'immediate', '1-2_weeks', '1_month', '3_months', 'exploring'
      ].map(timeline => {
        const leads = enrichments?.filter(l => l.buying_timeline === timeline) || [];
        return {
          timeline,
          count: leads.length,
          avgScore: leads.reduce((sum, l) => sum + (l.ai_score || 0), 0) / (leads.length || 1),
          conversionRate: leads.reduce((sum, l) => sum + (l.conversion_probability || 0), 0) / (leads.length || 1)
        };
      });

      return { stats, topLeads, timelineData };
    },
    refetchInterval: 30000
  });
}
