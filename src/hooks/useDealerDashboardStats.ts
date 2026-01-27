import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

interface DealerDashboardStats {
    myCars: number;
    activeLeads: number;
    thisMonthSales: number;
    pendingInspections: number;
    recentActivity: Array<{
        id: string;
        type: 'listing' | 'enquiry' | 'test_drive';
        title: string;
        timeAgo: string;
        createdAt: Date;
    }>;
}

export function useDealerDashboardStats(dealerId: string | null | undefined) {
    return useQuery({
        queryKey: ['dealer-dashboard-stats', dealerId],
        queryFn: async (): Promise<DealerDashboardStats> => {
            if (!dealerId) {
                return {
                    myCars: 0,
                    activeLeads: 0,
                    thisMonthSales: 0,
                    pendingInspections: 0,
                    recentActivity: [],
                };
            }

            // Get current month boundaries
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

            // Fetch all stats in parallel
            const [carsResult, leadsResult, salesResult, inspectionsResult, recentListings, recentEnquiries] = await Promise.all([
                // My Cars - count all car listings for this dealer
                (supabase as any)
                    .from('car_listings')
                    .select('id', { count: 'exact', head: true })
                    .eq('seller_id', dealerId),

                // Active Leads - enquiries with pending status
                (supabase as any)
                    .from('car_enquiries')
                    .select('id', { count: 'exact', head: true })
                    .eq('dealer_id', dealerId)
                    .eq('status', 'pending'),

                // This Month Sales - sold cars in current month
                (supabase as any)
                    .from('car_listings')
                    .select('id', { count: 'exact', head: true })
                    .eq('seller_id', dealerId)
                    .eq('status', 'sold')
                    .gte('sold_at', startOfMonth)
                    .lte('sold_at', endOfMonth),

                // Pending Inspections - pending test drive bookings
                (supabase as any)
                    .from('test_drive_bookings')
                    .select('id', { count: 'exact', head: true })
                    .eq('dealer_id', dealerId)
                    .eq('status', 'pending'),

                // Recent car listings (last 3)
                (supabase as any)
                    .from('car_listings')
                    .select(`
            id,
            created_at,
            brands:brand_id(name),
            models:model_id(name),
            variant
          `)
                    .eq('seller_id', dealerId)
                    .order('created_at', { ascending: false })
                    .limit(3),

                // Recent enquiries (last 3)
                (supabase as any)
                    .from('car_enquiries')
                    .select(`
            id,
            created_at,
            enquiry_type,
            car_listing:car_listings(
              brands:brand_id(name),
              models:model_id(name)
            )
          `)
                    .eq('dealer_id', dealerId)
                    .order('created_at', { ascending: false })
                    .limit(3),
            ]);

            // Helper function to format time ago
            const formatTimeAgo = (dateStr: string): string => {
                const date = new Date(dateStr);
                const now = new Date();
                const diffMs = now.getTime() - date.getTime();
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins} min ago`;
                if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            };

            // Combine and sort recent activity
            const recentActivity: DealerDashboardStats['recentActivity'] = [];

            if (recentListings.data) {
                recentListings.data.forEach((listing: any) => {
                    recentActivity.push({
                        id: listing.id,
                        type: 'listing',
                        title: `Listed ${listing.brands?.name || ''} ${listing.models?.name || ''} ${listing.variant || ''}`.trim(),
                        timeAgo: formatTimeAgo(listing.created_at),
                        createdAt: new Date(listing.created_at),
                    });
                });
            }

            if (recentEnquiries.data) {
                recentEnquiries.data.forEach((enquiry: any) => {
                    const carName = enquiry.car_listing
                        ? `${enquiry.car_listing.brands?.name || ''} ${enquiry.car_listing.models?.name || ''}`.trim()
                        : 'a car';
                    recentActivity.push({
                        id: enquiry.id,
                        type: 'enquiry',
                        title: `New ${enquiry.enquiry_type || 'enquiry'} for ${carName}`,
                        timeAgo: formatTimeAgo(enquiry.created_at),
                        createdAt: new Date(enquiry.created_at),
                    });
                });
            }

            // Sort by date and take top 3
            recentActivity.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

            return {
                myCars: carsResult.count || 0,
                activeLeads: leadsResult.count || 0,
                thisMonthSales: salesResult.count || 0,
                pendingInspections: inspectionsResult.count || 0,
                recentActivity: recentActivity.slice(0, 3),
            };
        },
        enabled: !!dealerId,
        staleTime: 30000, // Cache for 30 seconds
        refetchOnWindowFocus: true,
    });
}
