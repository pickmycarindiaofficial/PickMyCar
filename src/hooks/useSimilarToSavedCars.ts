import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useSavedCars } from './useSavedCars';

export function useSimilarToSavedCars() {
  const { data: savedCars } = useSavedCars();

  return useQuery({
    queryKey: ['similar-to-saved-cars', savedCars?.length],
    queryFn: async () => {
      if (!savedCars || savedCars.length === 0) {
        return [];
      }

      // Extract patterns from saved cars
      const brandIds = [...new Set(savedCars.map(item => (item.car_listings as any).brand_id).filter(Boolean))];
      const bodyTypeIds = [...new Set(savedCars.map(item => (item.car_listings as any).body_type_id).filter(Boolean))];
      const fuelTypeIds = [...new Set(savedCars.map(item => (item.car_listings as any).fuel_type_id).filter(Boolean))];
      const savedCarIds = savedCars.map(item => item.car_listing_id);

      // Calculate price range (average ± 30%)
      const avgPrice = savedCars.reduce((sum, item) => sum + Number(item.car_listings.expected_price), 0) / savedCars.length;
      const minPrice = avgPrice * 0.7;
      const maxPrice = avgPrice * 1.3;

      // Fetch similar cars
      // @ts-ignore - car_listings table type handling
      const { data, error } = await supabase
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
          brands ( name ),
          models ( name ),
          cities ( name ),
          fuel_types ( name ),
          transmissions ( name ),
          body_types ( name ),
          car_categories ( name )
        `)
        .eq('status', 'live')
        .not('id', 'in', `(${savedCarIds.join(',')})`)
        .or(`brand_id.in.(${brandIds.join(',')}),body_type_id.in.(${bodyTypeIds.join(',')})`)
        .gte('expected_price', minPrice)
        .lte('expected_price', maxPrice)
        .order('view_count', { ascending: false })
        .limit(12);

      if (error) throw error;
      return data || [];
    },
    enabled: !!savedCars && savedCars.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
