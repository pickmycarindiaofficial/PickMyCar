import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DealerListItem {
  id: string;
  dealership_name: string;
  full_name: string;
  username: string;
  email: string;
  avatar_url?: string;
  logo_url?: string;
  city_name?: string;
  total_listings: number;
  is_active: boolean;
}

export function useDealersList(currentUserId?: string) {
  const query = useQuery({
    queryKey: ['dealers-list', currentUserId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_dealers_list');

      if (error) {
        console.error('Error fetching dealers list:', error);
        console.error('💡 Make sure you have run messaging_system_setup.sql in Supabase SQL Editor');
        throw error;
      }

      // Filter out current user to prevent self-messaging
      const filtered = (data || []).filter(
        (dealer: DealerListItem) => !currentUserId || dealer.id !== currentUserId
      );
      return filtered as DealerListItem[];
    },
    retry: 2,
  });

  return {
    dealers: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
