import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export function useCarListingById(carId: string | undefined) {
  return useQuery({
    queryKey: ['car-listing', carId],
    queryFn: async () => {
      if (!carId) return null;

      // 1. Fetch from View (includes unified_seller_phone)
      const viewPromise = (supabase as any)
        .from('car_listings_detailed')
        .select('*')
        .eq('id', carId)
        .single();

      // 2. Fetch Features (via separate query)
      const featuresPromise = (supabase as any)
        .from('car_listing_features')
        .select(`
          id,
          features (
            id,
            name,
            category,
            icon
          )
        `)
        .eq('car_listing_id', carId);

      const [viewRes, featuresRes] = await Promise.all([viewPromise, featuresPromise]);

      if (viewRes.error) throw viewRes.error;

      const item: any = viewRes.data;
      const features = featuresRes.data || [];

      // Map flattened view columns back to nested objects expected by UI
      return {
        ...item,
        brands: item.brand_id ? { id: item.brand_id, name: item.brand_name, logo_url: item.brand_logo_url } : null,
        models: item.model_id ? { id: item.model_id, name: item.model_name } : null,
        fuel_types: item.fuel_type_id ? { id: item.fuel_type_id, name: item.fuel_type_name } : null,
        transmissions: item.transmission_id ? { id: item.transmission_id, name: item.transmission_name } : null,
        body_types: item.body_type_id ? { id: item.body_type_id, name: item.body_type_name } : null,
        owner_types: item.owner_type_id ? { id: item.owner_type_id, name: item.owner_type_name } : null,
        cities: item.city_id ? { id: item.city_id, name: item.city_name, state: item.city_state } : null,
        car_categories: item.category_id ? { id: item.category_id, name: item.category_name, badge_color: item.category_badge_color } : null,
        // Ensure seller info is available
        seller: {
          id: item.seller_id,
          username: '',
          full_name: item.unified_seller_name || 'Seller',
          phone_number: item.unified_seller_phone || ''
        },
        // Combine features
        car_listing_features: features,
        // Preserve photos array
        photos: item.photos || []
      };
    },
    enabled: !!carId,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
