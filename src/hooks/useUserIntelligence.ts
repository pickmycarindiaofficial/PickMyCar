import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UserIntelligenceFilters {
  intent?: string;
  budget?: string;
  buyingMode?: string;
  engagement?: string;
  quizCompleted?: string;
  lastSeen?: string;
  search?: string;
  location?: string;
}

export function useUserIntelligence(filters: UserIntelligenceFilters = {}) {
  return useQuery({
    queryKey: ['user-intelligence', filters],
    queryFn: async () => {
      // Call the RPC function instead of querying the view directly
      const { data, error } = await (supabase as any).rpc('get_user_intelligence');

      if (error) throw error;
      if (!data) return { users: [], stats: { hot: 0, warm: 0, cold: 0, new: 0, today: 0, total: 0 } };

      // Apply filters client-side
      let filteredData = [...data];

      if (filters.intent && filters.intent !== 'all') {
        filteredData = filteredData.filter((u: any) => u.intent === filters.intent);
      }

      if (filters.budget && filters.budget !== 'all') {
        filteredData = filteredData.filter((u: any) => u.budget_band === filters.budget);
      }

      if (filters.buyingMode && filters.buyingMode !== 'all') {
        filteredData = filteredData.filter((u: any) => u.buying_mode === filters.buyingMode);
      }

      if (filters.quizCompleted && filters.quizCompleted !== 'all') {
        const completed = filters.quizCompleted === 'yes';
        filteredData = filteredData.filter((u: any) => u.quiz_completed === completed);
      }

      if (filters.engagement && filters.engagement !== 'all') {
        if (filters.engagement === 'high') {
          filteredData = filteredData.filter((u: any) => u.engagement_score >= 70);
        } else if (filters.engagement === 'medium') {
          filteredData = filteredData.filter((u: any) => u.engagement_score >= 40 && u.engagement_score < 70);
        } else if (filters.engagement === 'low') {
          filteredData = filteredData.filter((u: any) => u.engagement_score < 40);
        }
      }

      if (filters.lastSeen && filters.lastSeen !== 'all') {
        const now = new Date();
        let cutoff: Date | undefined;

        if (filters.lastSeen === 'today') {
          cutoff = new Date(now.setHours(0, 0, 0, 0));
        } else if (filters.lastSeen === 'week') {
          cutoff = new Date(now.setDate(now.getDate() - 7));
        } else if (filters.lastSeen === 'month') {
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
        }

        if (cutoff) {
          filteredData = filteredData.filter((u: any) =>
            u.last_seen && new Date(u.last_seen) >= cutoff
          );
        }
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter((u: any) =>
          u.full_name?.toLowerCase().includes(searchLower) ||
          u.phone_number?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.location && filters.location !== 'all') {
        filteredData = filteredData.filter((u: any) => u.city_name === filters.location);
      }

      // Sort by engagement score descending
      filteredData.sort((a: any, b: any) => (b.engagement_score || 0) - (a.engagement_score || 0));

      // Calculate stats
      const stats = {
        hot: filteredData.filter((u: any) => u.intent === 'hot').length,
        warm: filteredData.filter((u: any) => u.intent === 'warm').length,
        cold: filteredData.filter((u: any) => u.intent === 'cold').length,
        new: filteredData.filter((u: any) => {
          const registered = new Date(u.registered_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return registered > weekAgo;
        }).length,
        today: filteredData.filter((u: any) => {
          const registered = new Date(u.registered_at);
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return registered >= startOfToday;
        }).length,
        total: filteredData.length,
      };

      return { users: filteredData, stats };
    },
  });
}
