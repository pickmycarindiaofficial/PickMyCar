import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";

export function useCarWithFeatures(carId: string | undefined) {
  return useQuery({
    queryKey: ['car-with-features', carId],
    queryFn: async () => {
      if (!carId) return null;

      const { data, error } = await (supabase as any)
        .from('car_listings')
        .select(`
          *,
          brands:brand_id(name),
          models:model_id(name),
          fuel_types:fuel_type_id(name),
          transmissions:transmission_id(name),
          body_types:body_type_id(name),
          owner_types:owner_type_id(name),
          cities:city_id(name, state),
          car_categories:category_id(name),
          car_listing_features(
            features:feature_id(
              id,
              name,
              category,
              icon
            )
          )
        `)
        .eq('id', carId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!carId,
  });
}
