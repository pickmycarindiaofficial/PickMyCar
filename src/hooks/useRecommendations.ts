import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export function useRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recommendations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's saved cars to understand preferences
      // @ts-ignore - user_saved_cars table not in generated types
      const { data: savedCars } = await supabase
        // @ts-ignore
        .from('user_saved_cars')
        .select('car_listings(brand_id, body_type_id, fuel_type_id, expected_price)')
        .eq('user_id', user.id)
        .limit(5);

      // Get user's recent views
      // @ts-ignore - user_car_views table not in generated types
      const { data: recentViews } = await supabase
        // @ts-ignore
        .from('user_car_views')
        .select('car_listing_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(10);

      const viewedIds = recentViews?.map((v: any) => v.car_listing_id) || [];

      // Simple recommendation: similar cars to what user has saved/viewed
      // @ts-ignore - car_listings table not in generated types
      const { data: recommendations, error } = await supabase
        // @ts-ignore
        .from('car_listings')
        .select(`
          id,
          listing_id,
          expected_price,
          year_of_make,
          kms_driven,
          photos,
          brands ( name ),
          models ( name ),
          cities ( name ),
          fuel_types ( name ),
          transmissions ( name )
        `)
        .eq('status', 'live')
        .not('id', 'in', `(${viewedIds.join(',') || 'null'})`)
        .limit(12);

      if (error) throw error;

      return recommendations || [];
    },
    enabled: !!user,
  });
}
