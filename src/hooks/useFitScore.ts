import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/types';

export function useFitScore(cars: Car[], userLocation?: { latitude: number; longitude: number } | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fitscore', user?.id, cars.length],
    queryFn: async () => {
      if (!user) return {};

      const { data, error } = await supabase.functions.invoke('calculate-fitscore', {
        body: {
          userId: user.id,
          carListings: cars,
          userLocation,
        },
      });

      if (error) throw error;
      return data?.scores || {};
    },
    enabled: !!user && cars.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
