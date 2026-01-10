import { useQuery } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';

export function useFuelTypes() {
  return useQuery({
    queryKey: ['fuel-types'],
    queryFn: async () => {
      // @ts-ignore - Table will be in types after migration
      const { data, error } = await (supabase as any)
        .from('fuel_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  }) as any;
}
