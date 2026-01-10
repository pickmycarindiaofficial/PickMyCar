import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DemandGap {
  id: string;
  user_id?: string;
  budget_min?: number;
  budget_max?: number;
  city?: string;
  must_haves?: any;
  note?: string;
  urgency?: string;
  status: string;
  created_at: string;
  updated_at: string;
  dealer_views: any[];
  dealer_responses: any[];
  priority_score: number;
  view_count: number;
  response_count: number;
  brand_preference?: string[];
  model_preference?: string[];
  year_min?: number;
  year_max?: number;
  preferred_colors?: string[];
  profiles?: {
    full_name: string;
    phone_number: string;
  };
}

interface DemandGapFilters {
  priority?: 'high' | 'medium' | 'low' | 'all';
  status?: string;
  search?: string;
}

export function useDemandGaps(filters: DemandGapFilters = {}) {
  const { user, hasRole } = useAuth();
  const isPowerDesk = hasRole('powerdesk');

  return useQuery({
    queryKey: ['demand-gaps', filters, user?.id],
    queryFn: async () => {
      let query = (supabase as any)
        .from('unmet_expectations')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone_number
          )
        `)
        .order('priority_score', { ascending: false })
        .order('created_at', { ascending: false });

      // Filter by status for dealers (only open/in_progress)
      if (!isPowerDesk) {
        query = query.in('status', ['open', 'in_progress']);
      }

      // Apply priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (filters.priority === 'high') {
          query = query.gte('priority_score', 80);
        } else if (filters.priority === 'medium') {
          query = query.gte('priority_score', 50).lt('priority_score', 80);
        } else if (filters.priority === 'low') {
          query = query.lt('priority_score', 50);
        }
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side search filter
      let filteredData = data || [];
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((gap: any) => 
          gap.note?.toLowerCase().includes(searchLower) ||
          gap.city?.toLowerCase().includes(searchLower) ||
          gap.profiles?.full_name?.toLowerCase().includes(searchLower)
        );
      }

      // Calculate stats
      const stats = {
        total: filteredData.length,
        new: filteredData.filter((g: any) => g.view_count === 0).length,
        inProgress: filteredData.filter((g: any) => g.status === 'in_progress').length,
        converted: filteredData.filter((g: any) => g.status === 'converted').length,
        high: filteredData.filter((g: any) => g.priority_score >= 80).length,
        medium: filteredData.filter((g: any) => g.priority_score >= 50 && g.priority_score < 80).length,
        low: filteredData.filter((g: any) => g.priority_score < 50).length,
      };

      return { demandGaps: filteredData as DemandGap[], stats };
    },
    enabled: !!user,
  });
}

export function useTrackDemandGapView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ demandGapId, dealerName }: { demandGapId: string; dealerName: string }) => {
      const { error } = await (supabase as any).rpc('track_dealer_view', {
        p_demand_gap_id: demandGapId,
        p_dealer_id: user!.id,
        p_dealer_name: dealerName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-gaps'] });
    },
  });
}

export function useRespondToDemandGap() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      demandGapId,
      responseType,
      message,
      matchedCars,
      dealerName,
    }: {
      demandGapId: string;
      responseType: 'have_cars' | 'dont_have' | 'can_source';
      message: string;
      matchedCars: string[];
      dealerName: string;
    }) => {
      const response = {
        dealer_id: user!.id,
        dealer_name: dealerName,
        responded_at: new Date().toISOString(),
        response_type: responseType,
        message,
        matched_cars: matchedCars,
        contact_attempted: false,
      };

      const { error } = await (supabase as any).rpc('add_dealer_response', {
        p_demand_gap_id: demandGapId,
        p_response: response,
      });

      if (error) throw error;

      // Get demand gap details for notification
      const { data: demandGap } = await (supabase as any)
        .from('unmet_expectations')
        .select('user_id, note')
        .eq('id', demandGapId)
        .single();

      // Notify customer if they have a user account
      if (demandGap?.user_id) {
        await (supabase as any).from('notifications').insert({
          user_id: demandGap.user_id,
          notification_type: 'dealer_match_found',
          title: 'We found matching cars for you!',
          message: `${dealerName} has ${matchedCars.length || 'matching'} cars for your requirements`,
        });
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-gaps'] });
      toast.success('Response sent successfully!');
    },
    onError: (error) => {
      toast.error('Failed to send response');
      console.error('Error responding to demand gap:', error);
    },
  });
}

export function useUpdateDemandGapStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      demandGapId,
      status,
      adminNotes,
    }: {
      demandGapId: string;
      status: string;
      adminNotes?: string;
    }) => {
      const updateData: any = { status };
      if (adminNotes) updateData.admin_notes = adminNotes;
      if (status === 'converted') updateData.converted_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from('unmet_expectations')
        .update(updateData)
        .eq('id', demandGapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-gaps'] });
      queryClient.invalidateQueries({ queryKey: ['demand-gaps-table'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
}
