import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface DealerSubscription {
  id: string;
  dealer_id: string;
  plan_id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  listings_used: number;
  featured_ads_used: number;
  payment_method: string | null;
  manually_activated: boolean;
}

export interface SubscriptionInfo {
  has_active_subscription: boolean;
  plan_name: string | null;
  listing_limit: number | null;
  listings_used: number;
  listings_remaining: number;
  featured_limit: number | null;
  featured_used: number;
  featured_remaining: number;
  subscription_ends_at: string | null;
}

export function useDealerSubscription(dealerId?: string) {
  return useQuery({
    queryKey: ['dealer-subscription', dealerId],
    queryFn: async () => {
      const id = dealerId || (await supabase.auth.getUser()).data.user?.id;
      
      const { data, error } = await (supabase as any)
        .rpc('get_dealer_subscription_info', { dealer_uuid: id });
      
      if (error) throw error;
      return ((data && data[0]) ? data[0] : {
        has_active_subscription: false,
        plan_name: null,
        listing_limit: null,
        listings_used: 0,
        listings_remaining: 0,
        featured_limit: null,
        featured_used: 0,
        featured_remaining: 0,
        subscription_ends_at: null,
      }) as SubscriptionInfo;
    },
    enabled: !!dealerId || true,
  });
}

export function useActivateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      dealer_id,
      plan_id,
      duration_months = 1,
      payment_method = 'razorpay',
      razorpay_payment_id,
      amount_paid,
    }: {
      dealer_id: string;
      plan_id: string;
      duration_months?: number;
      payment_method?: string;
      razorpay_payment_id?: string;
      amount_paid?: number;
    }) => {
      const ends_at = new Date();
      ends_at.setMonth(ends_at.getMonth() + duration_months);
      
      const { data, error } = await (supabase as any)
        .from('dealer_subscriptions')
        .insert([{
          dealer_id,
          plan_id,
          starts_at: new Date().toISOString(),
          ends_at: ends_at.toISOString(),
          status: 'active',
          payment_method,
          razorpay_payment_id,
          amount_paid,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-subscription'] });
      toast.success('Subscription activated successfully! 🎉');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate: ${error.message}`);
    },
  });
}

export function useManuallyActivateSubscription() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      dealer_id,
      plan_id,
      duration_months = 1,
      activation_notes,
    }: {
      dealer_id: string;
      plan_id: string;
      duration_months?: number;
      activation_notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const ends_at = new Date();
      ends_at.setMonth(ends_at.getMonth() + duration_months);
      
      const { data, error } = await (supabase as any)
        .from('dealer_subscriptions')
        .insert([{
          dealer_id,
          plan_id,
          starts_at: new Date().toISOString(),
          ends_at: ends_at.toISOString(),
          status: 'active',
          payment_method: 'manual',
          manually_activated: true,
          activated_by: user?.id,
          activation_notes,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-subscription'] });
      toast.success('Subscription manually activated by admin!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to activate: ${error.message}`);
    },
  });
}

export function useAllDealerSubscriptions() {
  return useQuery({
    queryKey: ['all-dealer-subscriptions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('dealer_subscriptions')
        .select(`
          *,
          dealer:profiles!dealer_id(full_name, username, phone_number),
          plan:subscription_plans(display_name, listing_limit, featured_ads_limit)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
