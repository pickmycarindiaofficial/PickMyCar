import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function useBodyTypes() {
  return useQuery({
    queryKey: ['body-types'],
    queryFn: async () => {
      // @ts-ignore - Table will be in types after migration
      const { data, error } = await (supabase as any)
        .from('body_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  }) as any;
}
