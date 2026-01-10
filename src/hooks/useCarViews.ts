import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export function useTrackCarView() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (carListingId: string) => {
      // @ts-ignore - user_car_views table not in generated types
      const { error } = await supabase
        // @ts-ignore
        .from('user_car_views')
        .insert({
          // @ts-ignore
          user_id: user?.id || null,
          // @ts-ignore
          car_listing_id: carListingId,
        });

      if (error) throw error;
    },
  });
}
