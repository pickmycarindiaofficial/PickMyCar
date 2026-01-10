import { useDealerBehaviorMetrics } from '@/hooks/useDealerBehaviorMetrics';
import { DealerBehaviorCards } from '@/components/dealers/DealerBehaviorCards';
import { ResponseTimeChart } from '@/components/dealers/ResponseTimeChart';
import { DealerLeaderboard } from '@/components/dealers/DealerLeaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DealerAnalytics() {
  const { user, roles } = useAuth();
  const isPowerDesk = roles.includes('powerdesk');
  const { data, isLoading } = useDealerBehaviorMetrics(isPowerDesk ? undefined : user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No dealer metrics available
        </CardContent>
      </Card>
    );
  }

  const { metrics, leaderboard } = data;
  const singleDealerMetrics = !Array.isArray(metrics) ? metrics : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dealer Performance Analytics</h1>
        <p className="text-muted-foreground">Track response times, conversion rates, and quality scores</p>
      </div>

      {singleDealerMetrics && (
        <>
          <DealerBehaviorCards metrics={singleDealerMetrics} />
          <ResponseTimeChart />
        </>
      )}

      {isPowerDesk && Array.isArray(metrics) && metrics.length > 0 && (
        <DealerLeaderboard dealers={leaderboard || metrics} />
      )}
    </div>
  );
}
