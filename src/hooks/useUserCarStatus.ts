import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserCarStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-car-status', user?.id],
    queryFn: async () => {
      if (!user) return { selling: [], interested: [] };

      // Cars user is selling
      // @ts-ignore - car_listings table not in generated types
      const { data: selling } = await supabase
        // @ts-ignore
        .from('car_listings')
        .select(`
          id,
          listing_id,
          status,
          expected_price,
          year_of_make,
          view_count,
          enquiry_count,
          created_at,
          photos,
          brands ( name ),
          models ( name ),
          cities ( name )
        `)
        .eq('seller_id', user.id)
        .eq('seller_type', 'individual')
        .order('created_at', { ascending: false });

      // Test drive bookings
      // @ts-ignore - test_drive_bookings table not in generated types
      const { data: testDrives } = await supabase
        // @ts-ignore
        .from('test_drive_bookings')
        .select(`
          id,
          preferred_date,
          preferred_time,
          status,
          car_listings (
            id,
            listing_id,
            expected_price,
            brands ( name ),
            models ( name )
          )
        `)
        .eq('user_id', user.id)
        .order('preferred_date', { ascending: false });

      // Conversations (inquiries)
      // @ts-ignore - conversations table not in generated types
      const { data: conversations } = await supabase
        // @ts-ignore
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          conversation_type
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      return {
        selling: selling || [],
        testDrives: testDrives || [],
        conversations: conversations || [],
      };
    },
    enabled: !!user,
  });
}
