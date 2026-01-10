import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function useTransmissions() {
  return useQuery({
    queryKey: ['transmissions'],
    queryFn: async () => {
      // @ts-ignore - Table will be in types after migration
      const { data, error } = await (supabase as any)
        .from('transmissions')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  }) as any;
}
