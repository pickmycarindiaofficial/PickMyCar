import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function useSeatOptions() {
  return useQuery({
    queryKey: ['seat-options'],
    queryFn: async () => {
      // @ts-ignore - Table will be in types after migration
      const { data, error } = await (supabase as any)
        .from('seat_options')
        .select('*')
        .eq('is_active', true)
        .order('seats');
      
      if (error) throw error;
      return data;
    },
  }) as any;
}
