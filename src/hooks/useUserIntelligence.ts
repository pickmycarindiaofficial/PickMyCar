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
      // Call the RPC function with filters
      // @ts-ignore
      const { data, error } = await supabase.rpc('get_user_intelligence', {
        search_text: filters.search || null,
        filter_intent: filters.intent && filters.intent !== 'all' ? filters.intent : null,
        filter_budget: filters.budget && filters.budget !== 'all' ? filters.budget : null,
        filter_buying_mode: filters.buyingMode && filters.buyingMode !== 'all' ? filters.buyingMode : null,
        filter_engagement: filters.engagement && filters.engagement !== 'all' ? filters.engagement : null,
        filter_location: filters.location && filters.location !== 'all' ? filters.location : null,
      });

      if (error) throw error;

      let users = data || [];

      // Sort by last_seen (recent logins) descending
      users.sort((a: any, b: any) => {
        const dateA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        const dateB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        return dateB - dateA;
      });

      // Calculate stats based on the returned (filtered) data
      // Note: Ideally, stats should be calculated by the backend too, 
      // but for now we can calculate them client-side based on the result set.
      const stats = {
        hot: users.filter((u: any) => u.intent === 'hot').length,
        warm: users.filter((u: any) => u.intent === 'warm').length,
        cold: users.filter((u: any) => u.intent === 'cold').length,
        new: users.filter((u: any) => {
          const registered = new Date(u.registered_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return registered > weekAgo;
        }).length,
        today: users.filter((u: any) => {
          const registered = new Date(u.registered_at);
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          return registered >= startOfToday;
        }).length,
        total: users.length,
      };

      return { users, stats };
    },
  });
}
