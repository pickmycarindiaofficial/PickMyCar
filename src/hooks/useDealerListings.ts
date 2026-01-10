import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export function useDealerListings(dealerId: string | null | undefined) {
  return useQuery({
    queryKey: ['dealer-listings', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;

      // @ts-ignore - car_listings table not in generated types
      const { data, error } = await supabase
        // @ts-ignore
        .from('car_listings')
        .select(`
          id,
          listing_id,
          variant,
          year_of_make,
          expected_price,
          status,
          view_count,
          created_at,
          brands:brand_id (name),
          models:model_id (name)
        `)
        .eq('seller_id', dealerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dealer listings:', error);
        throw error;
      }

      // @ts-ignore - mapping listing data
      return data?.map((listing: any) => ({
        ...listing,
        brand_name: listing.brands?.name || 'Unknown',
        model_name: listing.models?.name || 'Unknown',
      }));
    },
    enabled: !!dealerId,
  });
}
