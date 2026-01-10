import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface FunnelStageData {
  stage: string;
  count: number;
  dropOffRate: number;
  avgDuration: number;
  conversionRate: number;
}

export interface DropOffReason {
  reason: string;
  count: number;
  percentage: number;
}

export function useConversionFunnel(dateRange: { from: Date; to: Date }) {
  return useQuery({
    queryKey: ['conversion-funnel', dateRange],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('conversion_funnel')
        .select('*')
        .gte('entered_at', dateRange.from.toISOString())
        .lte('entered_at', dateRange.to.toISOString())
        .order('entered_at', { ascending: false }) as any;

      if (error) throw error;

      const stages = ['view', 'interest', 'engage', 'intent', 'convert'];
      const funnelData: FunnelStageData[] = stages.map((stage, index) => {
        const stageRecords = (data || []).filter(r => r.stage === stage);
        const previousStage = index > 0 ? (data || []).filter(r => r.stage === stages[index - 1]) : [];
        
        return {
          stage,
          count: stageRecords.length,
          dropOffRate: previousStage.length > 0 ? ((previousStage.length - stageRecords.length) / previousStage.length) * 100 : 0,
          avgDuration: stageRecords.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) / (stageRecords.length || 1),
          conversionRate: index < stages.length - 1 ? (stageRecords.filter(r => r.next_stage).length / (stageRecords.length || 1)) * 100 : 100
        };
      });

      const dropOffReasons: DropOffReason[] = [];
      const droppedRecords = (data || []).filter(r => r.dropped_off && r.drop_off_reason);
      const reasonCounts: Record<string, number> = {};
      
      droppedRecords.forEach(r => {
        reasonCounts[r.drop_off_reason] = (reasonCounts[r.drop_off_reason] || 0) + 1;
      });

      Object.entries(reasonCounts).forEach(([reason, count]) => {
        dropOffReasons.push({
          reason,
          count,
          percentage: (count / droppedRecords.length) * 100
        });
      });

      dropOffReasons.sort((a, b) => b.count - a.count);

      const totalSessions = new Set((data || []).map(r => r.session_id)).size;
      const convertedSessions = new Set((data || []).filter(r => r.stage === 'convert').map(r => r.session_id)).size;
      const overallConversionRate = (convertedSessions / (totalSessions || 1)) * 100;

      return { funnelData, dropOffReasons, totalSessions, overallConversionRate };
    },
    refetchInterval: 60000
  });
}
