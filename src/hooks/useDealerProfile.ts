import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DealerProfile {
  id: string;
  full_name: string;
  username: string;
  phone_number: string | null;
  avatar_url: string | null;
  is_active: boolean;
  dealership_name?: string;
  city_id?: string;
  city?: string;
  state?: string;
  logo_url?: string | null;
  year_established?: number | null;
}

export function useDealerProfile(dealerId: string | null | undefined) {
  return useQuery({
    queryKey: ['dealer-profile', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;

      try {
        // Always fetch dealer_profiles first (publicly readable)
        const { data: dealerProfileData, error: dealerError } = await (supabase as any)
          .from('dealer_profiles')
          .select('dealership_name, city_id, logo_url, year_established, cities(name, state)')
          .eq('id', dealerId)
          .maybeSingle();

        if (dealerError && dealerError.code !== 'PGRST116') {
          // Silent warning - not critical
        }

        // Fetch from profiles - use maybeSingle for graceful handling
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, username, phone_number, avatar_url, is_active')
          .eq('id', dealerId)
          .maybeSingle();

        // Handle RLS permission denied or other errors silently
        if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42501') {
          // Non-critical error
        }

        // If we have dealer_profiles but no profiles data, create minimal result
        if (!profileData && dealerProfileData) {
          return {
            id: dealerId,
            full_name: dealerProfileData.dealership_name || 'Dealer',
            username: '',
            phone_number: null,
            avatar_url: null,
            is_active: true,
            dealership_name: dealerProfileData.dealership_name || 'Dealer',
            city_id: dealerProfileData.city_id || '',
            city: dealerProfileData.cities?.name || '',
            state: dealerProfileData.cities?.state || '',
            logo_url: dealerProfileData.logo_url || null,
            year_established: dealerProfileData.year_established || null,
          } as DealerProfile;
        }

        // If we have both, merge them (ideal case)
        if (profileData) {
          return {
            id: profileData.id,
            full_name: profileData.full_name,
            username: profileData.username,
            phone_number: profileData.phone_number || null,
            avatar_url: profileData.avatar_url || null,
            is_active: profileData.is_active ?? true,
            dealership_name: dealerProfileData?.dealership_name || profileData.full_name || 'Dealer',
            city_id: dealerProfileData?.city_id || '',
            city: dealerProfileData?.cities?.name || '',
            state: dealerProfileData?.cities?.state || '',
            logo_url: dealerProfileData?.logo_url || null,
            year_established: dealerProfileData?.year_established || null,
          } as DealerProfile;
        }

        // Fallback: Try dealer_accounts for OTP dealers
        const { data: dealerAccountData } = await (supabase as any)
          .from('dealer_accounts')
          .select(`
            id,
            owner_name,
            dealership_name,
            phone_number,
            city_id,
            state,
            pincode,
            is_active,
            cities:city_id(name, state)
          `)
          .eq('id', dealerId)
          .maybeSingle();

        if (dealerAccountData) {
          return {
            id: dealerAccountData.id,
            full_name: dealerAccountData.owner_name || dealerAccountData.dealership_name || 'Dealer',
            username: dealerAccountData.dealership_name?.toLowerCase().replace(/\s+/g, '_') || '',
            phone_number: dealerAccountData.phone_number || null,
            avatar_url: null,
            is_active: dealerAccountData.is_active ?? true,
            dealership_name: dealerAccountData.dealership_name || 'Dealer',
            city_id: dealerAccountData.city_id || '',
            city: dealerAccountData.cities?.name || '',
            state: dealerAccountData.cities?.state || dealerAccountData.state || '',
            logo_url: null,
            year_established: null,
          } as DealerProfile;
        }

        // Neither found
        return null;
      } catch (error: any) {
        // Don't throw - return null to show graceful fallback UI
        return null;
      }
    },

    enabled: !!dealerId,
    retry: 1, // Reduce retries since we handle errors gracefully
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
