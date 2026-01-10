import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export function useTrendingCars(excludeIds: string[] = []) {
  return useQuery({
    queryKey: ['trending-cars', excludeIds.length],
    queryFn: async () => {
      // @ts-ignore - car_listings table type handling
      let query = supabase
        // @ts-ignore
        .from('car_listings')
        .select(`
          id,
          listing_id,
          expected_price,
          year_of_make,
          kms_driven,
          photos,
          status,
          seller_type,
          variant,
          color,
          highlights,
          is_featured,
          category_id,
          owner_type_id,
          seller_id,
          view_count,
          enquiry_count,
          brands ( name ),
          models ( name ),
          cities ( name ),
          fuel_types ( name ),
          transmissions ( name ),
          body_types ( name ),
          car_categories ( name )
        `)
        .eq('status', 'live')
        .order('view_count', { ascending: false })
        .limit(12);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
