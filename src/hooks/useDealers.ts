import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

export interface Dealer {
  id: string;
  full_name: string;
  username: string;
  is_pickmycar: boolean;
}

export interface DealerDetails {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone_number: string | null;
  is_active: boolean;
  dealership_name: string;
  business_type: string | null;
  gst_number: string | null;
  pan_number: string | null;
  address: string;
  city_id: string | null;
  city_name: string | null;
  state: string;
  pincode: string;
  gst_certificate_url: string | null;
  pan_card_url: string | null;
  shop_registration_url: string | null;
  subscription: {
    is_active: boolean;
    plan_name: string;
    listing_limit: number;
    featured_ads_limit: number;
    listings_remaining: number;
    featured_ads_remaining: number;
    ends_at: string | null;
  } | null;
}

export function useDealers() {
  return useQuery({
    queryKey: ['dealers'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.rpc('get_dealers_list');
      
      if (error) {
        console.error('Error fetching dealers:', error);
        throw error;
      }
      
      return ((data || []) as any[]).map(d => ({
        ...d,
        is_pickmycar: d.is_pickmycar || false
      })) as Dealer[];
    },
  });
}

interface CreateDealerData {
  dealership_name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  username: string;
  password: string;
  business_type?: string;
  gst_number?: string;
  pan_number?: string;
  address?: string;
  city_id?: string;
  state?: string;
  pincode?: string;
  plan_id: string;
}

export function useCreateDealer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateDealerData) => {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.owner_name,
            phone_number: data.phone_number,
            role: 'dealer',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create dealer profile
      // @ts-ignore - dealer_profiles table not in types yet
      const { error: profileError } = await supabase.from('dealer_profiles').insert({
        id: authData.user.id,
        dealership_name: data.dealership_name,
        business_type: data.business_type,
        gst_number: data.gst_number,
        pan_number: data.pan_number,
        address: data.address,
        city_id: data.city_id,
        state: data.state,
        pincode: data.pincode,
        is_documents_verified: true,
      } as any);

      if (profileError) throw profileError;

      // Create subscription
      const startsAt = new Date();
      const endsAt = new Date();
      endsAt.setMonth(endsAt.getMonth() + 1);

      // @ts-ignore - dealer_subscriptions table not in types yet
      const { error: subError } = await supabase.from('dealer_subscriptions').insert({
        dealer_id: authData.user.id,
        plan_id: data.plan_id,
        status: 'active',
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        manually_activated: true,
      } as any);

      if (subError) throw subError;

      return authData.user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-applications'] });
    },
  });
}

export function useDealerDetails(dealerId: string | null | undefined) {
  return useQuery({
    queryKey: ['dealer-details', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;

      // @ts-ignore - profiles table not in generated types
      const { data: profile, error: profileError } = await supabase
        // @ts-ignore
        .from('profiles')
        .select('id, full_name, username, phone_number, is_active')
        .eq('id', dealerId)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) return null;

      // @ts-ignore - dealer_profiles table not in generated types
      const { data: dealerProfile, error: dealerError } = await supabase
        // @ts-ignore
        .from('dealer_profiles')
        .select(`
          dealership_name,
          business_type,
          gst_number,
          pan_number,
          address,
          city_id,
          state,
          pincode,
          gst_certificate_url,
          pan_card_url,
          shop_registration_url,
          cities:city_id (name)
        `)
        .eq('id', dealerId)
        .maybeSingle();

      if (dealerError) throw dealerError;

      // @ts-ignore
      const { data: subscriptionData } = await supabase.rpc('get_dealer_subscription_info', {
        dealer_uuid: dealerId,
      });

      // @ts-ignore - Type assertion for complete object
      const result: DealerDetails = {
        // @ts-ignore
        id: profile.id,
        // @ts-ignore
        full_name: profile.full_name,
        // @ts-ignore
        username: profile.username,
        // @ts-ignore
        email: profile.email || '',
        // @ts-ignore
        phone_number: profile.phone_number,
        // @ts-ignore
        is_active: profile.is_active,
        // @ts-ignore
        dealership_name: dealerProfile?.dealership_name || '',
        // @ts-ignore
        business_type: dealerProfile?.business_type || null,
        // @ts-ignore
        gst_number: dealerProfile?.gst_number || null,
        // @ts-ignore
        pan_number: dealerProfile?.pan_number || null,
        // @ts-ignore
        address: dealerProfile?.address || '',
        // @ts-ignore
        city_id: dealerProfile?.city_id || null,
        // @ts-ignore
        city_name: dealerProfile?.cities?.name || null,
        // @ts-ignore
        state: dealerProfile?.state || '',
        // @ts-ignore
        pincode: dealerProfile?.pincode || '',
        // @ts-ignore
        gst_certificate_url: dealerProfile?.gst_certificate_url || null,
        // @ts-ignore
        pan_card_url: dealerProfile?.pan_card_url || null,
        // @ts-ignore
        shop_registration_url: dealerProfile?.shop_registration_url || null,
        subscription: subscriptionData && subscriptionData[0] ? {
          is_active: subscriptionData[0].has_active_subscription || false,
          plan_name: subscriptionData[0].plan_name || '',
          listing_limit: subscriptionData[0].listing_limit || 0,
          featured_ads_limit: subscriptionData[0].featured_limit || 0,
          listings_remaining: subscriptionData[0].listings_remaining || 0,
          featured_ads_remaining: subscriptionData[0].featured_remaining || 0,
          ends_at: subscriptionData[0].subscription_ends_at || null
        } : null,
      };

      return result;
    },
    enabled: !!dealerId,
  });
}

export function useUpdateDealerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dealerId, data }: { dealerId: string; data: any }) => {
      // @ts-ignore - profiles table not in generated types
      const { error: profileError } = await supabase
        // @ts-ignore
        .from('profiles')
        // @ts-ignore
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number,
        })
        .eq('id', dealerId);

      if (profileError) throw profileError;

      // @ts-ignore - dealer_profiles table not in generated types
      const { error: dealerError } = await supabase
        // @ts-ignore
        .from('dealer_profiles')
        // @ts-ignore
        .update({
          dealership_name: data.dealership_name,
          business_type: data.business_type,
          gst_number: data.gst_number,
          pan_number: data.pan_number,
          address: data.address,
          city_id: data.city_id,
          state: data.state,
          pincode: data.pincode,
        })
        .eq('id', dealerId);

      if (dealerError) throw dealerError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-details', variables.dealerId] });
    },
  });
}

export function useSuspendDealer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ dealerId, reason }: { dealerId: string; reason: string }) => {
      // @ts-ignore - profiles table not in generated types
      const { error: profileError } = await supabase
        // @ts-ignore
        .from('profiles')
        // @ts-ignore
        .update({ is_active: false })
        .eq('id', dealerId);

      if (profileError) throw profileError;

      // @ts-ignore - car_listings table not in generated types
      const { error: listingsError } = await supabase
        // @ts-ignore
        .from('car_listings')
        // @ts-ignore
        .update({ status: 'inactive' })
        .eq('seller_id', dealerId)
        .eq('status', 'live');

      if (listingsError) console.error('Error deactivating listings:', listingsError);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-details', variables.dealerId] });
      queryClient.invalidateQueries({ queryKey: ['dealer-listings', variables.dealerId] });
    },
  });
}
