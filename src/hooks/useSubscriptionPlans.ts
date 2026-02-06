import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_period: string;
  listing_limit: number;
  featured_ads_limit: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useAllSubscriptionPlans() {
  return useQuery({
    queryKey: ['all-subscription-plans'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('subscription_plans')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc('create_subscription_plan', {
        p_plan: { ...plan, created_by: user?.id }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-subscription-plans'] });
      toast.success('Plan created successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubscriptionPlan> & { id: string }) => {
      const { data, error } = await supabase.rpc('update_subscription_plan', {
        p_id: id,
        p_updates: updates
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-subscription-plans'] });
      toast.success('Plan updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      // Soft delete via toggle function
      const { data, error } = await supabase.rpc('toggle_plan_status', {
        p_id: planId,
        p_is_active: false
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-subscription-plans'] });
      toast.success('Plan deactivated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete plan: ${error.message}`);
    },
  });
}

export function useTogglePlanStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase.rpc('toggle_plan_status', {
        p_id: id,
        p_is_active: is_active
      });

      if (error) throw error;
      if (data && data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['all-subscription-plans'] });
      toast.success(`Plan ${variables.is_active ? 'activated' : 'deactivated'}!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });
}
