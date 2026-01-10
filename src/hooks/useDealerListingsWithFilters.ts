import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface FilterOptions {
  brands?: string[];
  fuelTypes?: string[];
  bodyTypes?: string[];
  transmissions?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'year_desc' | 'year_asc' | 'recent';
}

export function useDealerListingsWithFilters(
  dealerId: string | undefined,
  filters: FilterOptions = {}
) {
  return useQuery({
    queryKey: ['dealer-listings-filtered', dealerId, filters],
    queryFn: async () => {
      if (!dealerId) return [];

      let query = (supabase as any)
        .from('car_listings')
        .select(`
          id,
          listing_id,
          variant,
          year_of_make,
          expected_price,
          status,
          view_count,
          kms_driven,
          color,
          created_at,
          photos,
          highlights,
          brands:brand_id (name),
          models:model_id (name),
          fuel_types:fuel_type_id (name),
          transmissions:transmission_id (name),
          body_types:body_type_id (name),
          cities:city_id (name, state)
        `)
        .eq('seller_id', dealerId)
        .eq('seller_type', 'dealer')
        .in('status', ['live', 'verified']);

      // Apply sorting
      switch (filters.sortBy) {
        case 'price_asc':
          query = query.order('expected_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('expected_price', { ascending: false });
          break;
        case 'year_desc':
          query = query.order('year_of_make', { ascending: false });
          break;
        case 'year_asc':
          query = query.order('year_of_make', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side filtering for brands, fuel types, body types, transmissions
      let filteredData = data || [];

      if (filters.brands && filters.brands.length > 0) {
        filteredData = filteredData.filter((listing: any) =>
          filters.brands?.includes(listing.brands?.name)
        );
      }

      if (filters.fuelTypes && filters.fuelTypes.length > 0) {
        filteredData = filteredData.filter((listing: any) =>
          filters.fuelTypes?.includes(listing.fuel_types?.name)
        );
      }

      if (filters.bodyTypes && filters.bodyTypes.length > 0) {
        filteredData = filteredData.filter((listing: any) =>
          filters.bodyTypes?.includes(listing.body_types?.name)
        );
      }

      if (filters.transmissions && filters.transmissions.length > 0) {
        filteredData = filteredData.filter((listing: any) =>
          filters.transmissions?.includes(listing.transmissions?.name)
        );
      }

      return filteredData.map((listing: any) => ({
        ...listing,
        brand_name: listing.brands?.name || 'Unknown',
        model_name: listing.models?.name || 'Unknown',
        fuel_type: listing.fuel_types?.name || 'Unknown',
        transmission: listing.transmissions?.name || 'Unknown',
        body_type: listing.body_types?.name || 'Unknown',
        city_name: listing.cities?.name || '',
      }));
    },
    enabled: !!dealerId,
  });
}
