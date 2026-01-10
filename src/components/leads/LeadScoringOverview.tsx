import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, TrendingUp, Thermometer, Snowflake } from 'lucide-react';
import { LeadIntelligenceStats } from '@/hooks/useLeadIntelligence';

interface LeadScoringOverviewProps {
  stats: LeadIntelligenceStats;
}

export function LeadScoringOverview({ stats }: LeadScoringOverviewProps) {
  const getTrendIcon = () => {
    switch (stats.qualityTrend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
          <Flame className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.hotLeads}</div>
          <p className="text-xs text-muted-foreground">
            High intent, immediate action
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
          <Thermometer className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.warmLeads}</div>
          <p className="text-xs text-muted-foreground">
            Interested, nurture needed
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cold Leads</CardTitle>
          <Snowflake className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.coldLeads}</div>
          <p className="text-xs text-muted-foreground">
            Early exploration phase
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg AI Score</CardTitle>
          {getTrendIcon()}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {stats.qualityTrend}
            </Badge> quality trend
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
