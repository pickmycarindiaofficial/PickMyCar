import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export function useExistingTestDriveBooking(carId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['existing-test-drive-booking', user?.id, carId],
    queryFn: async () => {
      if (!user?.id || !carId) return null;

      // @ts-ignore - test_drive_bookings not in generated types
      const { data, error } = await supabase
        .from('test_drive_bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('car_listing_id', carId)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!carId,
  });
}
