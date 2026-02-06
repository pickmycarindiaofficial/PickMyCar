import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Dealer type for backwards compatibility with existing components
export interface Dealer {
  id: string;
  username: string;
  phone_number: string;
  dealership_name: string;
  owner_name: string;
  full_name: string; // Mapped from owner_name for backwards compatibility
  email: string | null;
  business_type: string | null;
  gst_number: string | null;
  pan_number: string | null;
  address: string | null;
  city_id: string | null;
  state: string | null;
  pincode: string | null;
  plan_id: string | null;
  subscription_status: string;
  subscription_starts_at: string;
  subscription_ends_at: string;
  is_active: boolean;
  is_pickmycar?: boolean; // For display purposes
  last_login_at: string | null;
  created_at: string;
}

// Fetch all dealers with their subscription info
export function useDealers() {
  return useQuery({
    queryKey: ['dealers'],
    queryFn: async (): Promise<Dealer[]> => {
      try {
        console.log('[useDealers] Fetching dealers from dealer_accounts...');

        // Get dealers from the new dealer_accounts table
        const { data, error } = await supabase
          .from('dealer_accounts')
          .select(`
            id,
            username,
            phone_number,
            dealership_name,
            owner_name,
            email,
            business_type,
            gst_number,
            pan_number,
            address,
            city_id,
            state,
            pincode,
            plan_id,
            subscription_status,
            subscription_starts_at,
            subscription_ends_at,
            is_active,
            last_login_at,
            created_at
          `)
          .order('created_at', { ascending: false });

        console.log('[useDealers] Raw response:', { data, error });

        if (error) {
          // If table doesn't exist yet, return empty array instead of crashing
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            console.warn('[useDealers] dealer_accounts table not found. Please run dealer_system_schema.sql');
            return [];
          }
          console.error('[useDealers] Error fetching dealers:', error);
          return []; // Return empty array instead of throwing
        }

        // Map data to include full_name for backwards compatibility
        const result = (data || []).map((dealer: any) => ({
          ...dealer,
          full_name: dealer.owner_name || dealer.dealership_name,
          is_pickmycar: false, // All are independent dealers
        }));

        console.log('[useDealers] Mapped result:', result);
        return result;
      } catch (err) {
        console.error('[useDealers] Unexpected error:', err);
        return [];
      }
    },
  });
}



// Get a single dealer's details
export function useDealerDetails(dealerId: string | null | undefined) {
  return useQuery({
    queryKey: ['dealer-details', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;

      const { data, error } = await supabase
        .from('dealer_accounts')
        .select('*')
        .eq('id', dealerId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!dealerId,
  });
}

// Interface for creating a dealer
interface CreateDealerData {
  username: string;
  phone_number: string;
  dealership_name: string;
  owner_name: string;
  email?: string;
  business_type?: string;
  gst_number?: string;
  pan_number?: string;
  address?: string;
  city_id?: string;
  state?: string;
  pincode?: string;
  plan_id?: string;
}

// Create dealer using new Edge Function
export function useCreateDealer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDealerData) => {
      // Get staff session from localStorage (can be staff_session or admin)
      const staffSessionStr = localStorage.getItem('staff_session');
      let staffId: string | null = null;

      if (staffSessionStr) {
        try {
          const staffSession = JSON.parse(staffSessionStr);
          staffId = staffSession.staffId;
        } catch (e) {
          console.warn('Error parsing staff session:', e);
        }
      }

      // For development/testing - try direct insert if no Edge Function
      // This will work once dealer_system_schema.sql is run
      try {
        const { data: result, error } = await supabase.rpc('create_dealer_account', {
          p_username: data.username,
          p_phone_number: data.phone_number,
          p_dealership_name: data.dealership_name,
          p_owner_name: data.owner_name,
          p_email: data.email || null,
          p_business_type: data.business_type || null,
          p_gst_number: data.gst_number || null,
          p_pan_number: data.pan_number || null,
          p_address: data.address || null,
          p_city_id: data.city_id || null,
          p_state: data.state || null,
          p_pincode: data.pincode || null,
          p_plan_id: data.plan_id || null,
          p_created_by: staffId,
        });

        if (error) {
          // If the function doesn't exist, table might not be created yet
          if (error.message?.includes('does not exist')) {
            throw new Error('Database not initialized. Please run dealer_system_schema.sql in Supabase SQL Editor first.');
          }
          throw new Error(error.message);
        }

        return { success: true, dealer_id: result };
      } catch (rpcError: any) {
        console.error('RPC error:', rpcError);
        throw new Error(rpcError.message || 'Failed to create dealer account');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
    },
  });
}


// Update dealer status
export function useUpdateDealerStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealerId, isActive }: { dealerId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('dealer_accounts')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', dealerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
    },
  });
}

// Get subscription plans
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

// Update dealer profile
export function useUpdateDealerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealerId, updates }: { dealerId: string; updates: Partial<Dealer> }) => {
      const { error } = await supabase
        .from('dealer_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', dealerId);

      if (error) {
        // If table doesn't exist, just log and return
        if (error.message?.includes('does not exist')) {
          console.warn('dealer_accounts table not found');
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-details'] });
    },
  });
}

// Suspend dealer account
export function useSuspendDealer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dealerId, reason }: { dealerId: string; reason: string }) => {
      // Use the Secure RPC function
      const { data, error } = await supabase.rpc('suspend_dealer', {
        p_dealer_id: dealerId,
        p_reason: reason
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to suspend dealer');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-details'] });
    },
  });
}

// Activate (Unsuspend) dealer account
export function useActivateDealer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealerId: string) => {
      // Use the Secure RPC function
      const { data, error } = await supabase.rpc('activate_dealer', {
        p_dealer_id: dealerId
      });

      if (error) throw error;
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to activate dealer');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-details'] });
    },
  });
}

// Delete dealer account (PERMANENT)
export function useDeleteDealer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dealerId: string) => {
      const { data, error } = await supabase.rpc('delete_dealer_account', {
        p_dealer_id: dealerId
      });

      if (error) throw error;

      // Check for application-level error returned as success from RPC
      if (data && data.success === false) {
        throw new Error(data.message || 'Failed to delete dealer');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-details'] });
    },
  });
}
