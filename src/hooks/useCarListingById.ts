import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export function useCarListingById(carId: string | undefined) {
  return useQuery({
    queryKey: ['car-listing', carId],
    queryFn: async () => {
      if (!carId) return null;

      const { data, error } = await (supabase as any)
        .from('car_listings')
        .select(`
          *,
          brands(id, name, logo_url),
          models(id, name),
          body_types(id, name),
          fuel_types(id, name),
          transmissions(id, name),
          owner_types(id, name),
          cities(id, name, state),
          car_categories(id, name, badge_color),
          car_listing_features(
            id,
            features(id, name, category, icon)
          )
        `)
        .eq('id', carId)
        .eq('status', 'live')
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!carId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
