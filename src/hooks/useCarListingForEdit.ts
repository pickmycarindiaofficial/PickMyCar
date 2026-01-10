import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export function useCarListingForEdit(carId: string | null | undefined) {
  return useQuery({
    queryKey: ['car-listing-edit', carId],
    queryFn: async () => {
      if (!carId) return null;

      const { data, error } = await (supabase as any)
        .from('car_listings')
        .select(`
          *,
          car_listing_features(
            feature_id
          )
        `)
        .eq('id', carId)
        .single();

      if (error) throw error;
      
      // Transform features into array of IDs for form
      const featureIds = data.car_listing_features?.map((f: any) => f.feature_id) || [];
      
      return {
        ...data,
        feature_ids: featureIds
      };
    },
    enabled: !!carId,
    staleTime: 0, // Always fetch fresh data for editing
  });
}
