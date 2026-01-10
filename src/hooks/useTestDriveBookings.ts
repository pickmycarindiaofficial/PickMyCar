import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export function useTestDriveBookings() {
  const { user, roles } = useAuth();
  const isPowerDesk = roles?.includes('powerdesk');

  return useQuery({
    queryKey: ['test-drive-bookings', user?.id, isPowerDesk],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = (supabase as any)
        .from('test_drive_bookings')
        .select(`
          *,
          car_listings!test_drive_bookings_car_listing_id_fkey(
            id,
            listing_id,
            variant,
            year_of_make,
            photos,
            brand_id,
            model_id,
            brands!car_listings_brand_id_fkey(name),
            models!car_listings_model_id_fkey(name)
          ),
          profiles!test_drive_bookings_user_id_fkey(
            full_name,
            phone_number
          )
        `);

      // PowerDesk sees ALL bookings, Dealers only see their own
      if (!isPowerDesk) {
        query = query.eq('dealer_id', user.id);
      }

      const { data, error } = await query
        .order('preferred_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
