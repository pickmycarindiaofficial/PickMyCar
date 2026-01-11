import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

// Helper to get current user ID (supports both Supabase auth and customer session)
const getCurrentUserId = async (): Promise<string | null> => {
  // First check for Supabase auth user
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    return user.id;
  }

  // Check for customer session
  const customerPhone = sessionStorage.getItem('pmc_customer_phone');
  const customerToken = sessionStorage.getItem('pmc_customer_token');

  if (customerPhone && customerToken) {
    // Get customer profile ID from database
    const { data: customerProfile } = await (supabase as any)
      .from('customer_profiles')
      .select('id')
      .eq('phone_number', customerPhone)
      .single();

    if (customerProfile?.id) {
      return customerProfile.id;
    }
  }

  return null;
};

export function useSavedCars() {
  return useQuery({
    queryKey: ['saved-cars'],
    queryFn: async () => {
      const userId = await getCurrentUserId();

      if (!userId) {
        return [];
      }

      // @ts-ignore - user_saved_cars table not in generated types
      const { data, error } = await supabase
        // @ts-ignore
        .from('user_saved_cars')
        .select(`
          id,
          saved_at,
          car_listing_id,
          car_listings (
            id,
            listing_id,
            expected_price,
            year_of_make,
            kms_driven,
            photos,
            status,
            seller_type,
            brands ( name ),
            models ( name ),
            cities ( name ),
            fuel_types ( name ),
            transmissions ( name )
          )
        `)
        .eq('user_id', userId)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddSavedCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carListingId: string) => {
      const userId = await getCurrentUserId();

      if (!userId) {
        throw new Error('Please login to save cars');
      }

      // @ts-ignore - user_saved_cars table not in generated types
      const { error } = await supabase
        // @ts-ignore
        .from('user_saved_cars')
        // @ts-ignore
        .insert([{
          car_listing_id: carListingId,
          user_id: userId
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cars'] });
      toast.success('Car added to favorites');
    },
    onError: (error: any) => {
      if (error.message === 'Please login to save cars') {
        toast.error('Please login to save cars', {
          action: {
            label: 'Login',
            onClick: () => window.location.href = '/auth',
          },
        });
      } else {
        toast.error(error.message || 'Failed to save car');
      }
    },
  });
}

export function useRemoveSavedCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carListingId: string) => {
      const userId = await getCurrentUserId();

      if (!userId) {
        throw new Error('Please login to manage saved cars');
      }

      // @ts-ignore - user_saved_cars table not in generated types
      const { error } = await supabase
        // @ts-ignore
        .from('user_saved_cars')
        .delete()
        .eq('car_listing_id', carListingId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cars'] });
      toast.success('Car removed from favorites');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove car');
    },
  });
}
