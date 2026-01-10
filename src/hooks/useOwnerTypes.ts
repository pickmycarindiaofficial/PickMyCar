import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function useOwnerTypes() {
  return useQuery({
    queryKey: ['owner-types'],
    queryFn: async () => {
      // @ts-ignore - Table will be in types after migration
      const { data, error } = await (supabase as any)
        .from('owner_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data;
    },
  }) as any;
}
