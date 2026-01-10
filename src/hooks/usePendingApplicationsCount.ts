import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function usePendingApplicationsCount() {
  return useQuery({
    queryKey: ['dealer-applications-count'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.rpc('get_pending_applications_count');

      if (error) {
        console.error('Error fetching pending count:', error);
        return 0;
      }

      return data as number;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
