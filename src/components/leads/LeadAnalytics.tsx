import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, Target, PhoneCall } from 'lucide-react';

export function LeadAnalytics() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['lead-analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch all dealer enquiries
      const { data: enquiries, error } = await (supabase as any)
        .from('car_enquiries')
        .select('id, status, created_at, contacted_at')
        .eq('dealer_id', user.id);

      if (error) throw error;

      // Calculate stats
      const total = enquiries?.length || 0;
      const contacted = enquiries?.filter((e: any) => e.contacted_at)?.length || 0;
      const converted = enquiries?.filter((e: any) => e.status === 'converted')?.length || 0;
      
      // Calculate average response time (in hours)
      const responseTimes = enquiries
        ?.filter((e: any) => e.contacted_at)
        ?.map((e: any) => {
          const created = new Date(e.created_at).getTime();
          const contacted = new Date(e.contacted_at).getTime();
          return (contacted - created) / (1000 * 60 * 60); // Convert to hours
        }) || [];
      
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      return {
        total,
        contacted,
        converted,
        responseRate: total > 0 ? (contacted / total) * 100 : 0,
        conversionRate: total > 0 ? (converted / total) * 100 : 0,
        avgResponseTime,
      };
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <PhoneCall className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.responseRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats?.contacted || 0} of {stats?.total || 0} contacted
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats?.avgResponseTime ? `${stats.avgResponseTime.toFixed(1)}h` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">Time to first contact</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats?.converted || 0} converted
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
