import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export function useSavedCars() {
  return useQuery({
    queryKey: ['saved-cars'],
    queryFn: async () => {
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
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // @ts-ignore - user_saved_cars table not in generated types
      const { error } = await supabase
        // @ts-ignore
        .from('user_saved_cars')
        // @ts-ignore
        .insert([{ 
          car_listing_id: carListingId,
          user_id: user.id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-cars'] });
      toast.success('Car added to favorites');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save car');
    },
  });
}

export function useRemoveSavedCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (carListingId: string) => {
      // @ts-ignore - user_saved_cars table not in generated types
      const { error } = await supabase
        // @ts-ignore
        .from('user_saved_cars')
        .delete()
        .eq('car_listing_id', carListingId);

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
