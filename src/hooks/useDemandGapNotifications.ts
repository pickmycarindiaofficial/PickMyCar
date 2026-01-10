import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DemandGapNotification {
  id: string;
  demand_gap_id: string;
  dealer_id: string;
  notification_type: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  metadata: any;
  unmet_expectations?: {
    id: string;
    budget_max: number;
    city: string;
    note: string;
    urgency: string;
    priority_score: number;
  };
}

export function useDemandGapNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['demand-gap-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('demand_gap_notifications')
        .select(`
          *,
          unmet_expectations (
            id,
            budget_max,
            city,
            note,
            urgency,
            priority_score
          )
        `)
        .eq('dealer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as DemandGapNotification[];
    },
    enabled: !!user,
  });
}

export function useUnreadDemandGapCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-demand-gap-count', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_unread_demand_gap_count', {
        p_dealer_id: user!.id,
      });

      if (error) throw error;
      return data as number;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkDemandGapNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await (supabase as any)
        .from('demand_gap_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-gap-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-demand-gap-count'] });
    },
  });
}

export function useMarkAllDemandGapNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('demand_gap_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('dealer_id', user!.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demand-gap-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-demand-gap-count'] });
    },
  });
}
