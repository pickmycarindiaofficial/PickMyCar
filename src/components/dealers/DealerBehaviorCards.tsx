import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, CheckCircle, Award } from 'lucide-react';
import { DealerMetrics } from '@/hooks/useDealerBehaviorMetrics';

interface DealerBehaviorCardsProps {
  metrics: DealerMetrics;
}

export function DealerBehaviorCards({ metrics }: DealerBehaviorCardsProps) {
  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.response_rate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.leads_responded} of {metrics.total_leads_received} leads
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversion_rate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.leads_converted} conversions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatResponseTime(metrics.avg_response_time_minutes)}
          </div>
          <p className="text-xs text-muted-foreground">
            Fastest: {formatResponseTime(metrics.fastest_response_minutes)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
          <Award className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.quality_score.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">
            Reliability: {metrics.reliability_score.toFixed(0)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
