import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

interface AdminDashboardStats {
    totalUsers: number;
    activeCars: number;
    messagesToday: number;
    systemHealth: number; // Placeholder percentage
}

export function useAdminDashboardStats() {
    return useQuery({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async (): Promise<AdminDashboardStats> => {

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const startOfDayISO = startOfDay.toISOString();

            // Parallel fetch
            const [usersResult, carsResult, messagesResult] = await Promise.all([
                // Total Users (profiles or auth.users - usually profiles is publicly accessible count)
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact', head: true }),

                // Active Cars
                supabase
                    .from('car_listings')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'live'),

                // Messages Today
                supabase
                    .from('messages')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_deleted', false)
                    .gte('sent_at', startOfDayISO)
            ]);

            return {
                totalUsers: usersResult.count || 0,
                activeCars: carsResult.count || 0,
                messagesToday: messagesResult.count || 0,
                systemHealth: 98, // Static for now
            };
        },
        staleTime: 60000, // 1 minute
    });
}
