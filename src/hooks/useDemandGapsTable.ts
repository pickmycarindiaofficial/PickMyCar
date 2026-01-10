import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { DemandGap } from './useDemandGaps';

export interface DemandGapTableRow extends DemandGap {
  user_name: string;
  user_phone: string;
  fuel_type_names: string;
}

interface TableFilters {
  search?: string;
  priority?: 'high' | 'medium' | 'low' | 'all';
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useDemandGapsTable(filters: TableFilters = {}) {
  const { user, hasRole } = useAuth();
  const isPowerDesk = hasRole('powerdesk');

  return useQuery({
    queryKey: ['demand-gaps-table', filters, user?.id],
    queryFn: async () => {
      let query = (supabase as any)
        .from('unmet_expectations')
        .select(`
          *,
          profiles:user_id (
            full_name,
            phone_number,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by status for dealers (only open/in_progress)
      if (!isPowerDesk) {
        query = query.in('status', ['open', 'in_progress']);
      }

      // Apply date range filter
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply priority filter
      if (filters.priority && filters.priority !== 'all') {
        if (filters.priority === 'high') {
          query = query.gte('priority_score', 80);
        } else if (filters.priority === 'medium') {
          query = query.gte('priority_score', 50).lt('priority_score', 80);
        } else if (filters.priority === 'low') {
          query = query.lt('priority_score', 50);
        }
      }

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process data to flatten for table display
      const processedData: DemandGapTableRow[] = (data || []).map((gap: any) => {
        // Handle must_haves JSONB - extract fuel_types array
        let fuelTypes = 'Any';
        if (gap.must_haves && typeof gap.must_haves === 'object') {
          if (Array.isArray(gap.must_haves.fuel_types) && gap.must_haves.fuel_types.length > 0) {
            fuelTypes = gap.must_haves.fuel_types.join(', ');
          }
        }

        return {
          ...gap,
          user_name: gap.profiles?.full_name || 'Guest User',
          user_phone: gap.profiles?.phone_number || 'Not provided',
          fuel_type_names: fuelTypes,
        };
      });

      // Client-side search filter
      let filteredData = processedData;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((gap) => 
          gap.user_name.toLowerCase().includes(searchLower) ||
          gap.user_phone.includes(searchLower) ||
          gap.city?.toLowerCase().includes(searchLower) ||
          gap.note?.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    },
    enabled: !!user,
  });
}
