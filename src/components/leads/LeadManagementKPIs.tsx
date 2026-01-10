import { Card, CardContent } from '@/components/ui/card';
import { Clock, Flame, TrendingUp, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadManagementKPIsProps {
  avgReactionTimeMinutes: number;
  hotLeadsCount: number;
  competitionRisk: number;
  leadsInView: number;
}

export function LeadManagementKPIs({
  avgReactionTimeMinutes,
  hotLeadsCount,
  competitionRisk,
  leadsInView
}: LeadManagementKPIsProps) {
  const formatReactionTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Avg Reaction Time */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Reaction Time</p>
              <p className="text-2xl font-bold mt-1">{formatReactionTime(avgReactionTimeMinutes)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hot Leads (Active Now) */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Hot Leads</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold">{hotLeadsCount}</p>
                <Badge variant="destructive" className="animate-pulse">Active Now</Badge>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Flame className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competition Risk */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Competition Risk</p>
              <p className="text-2xl font-bold mt-1">{competitionRisk.toFixed(1)}x</p>
              <p className="text-xs text-muted-foreground mt-1">Avg dealers per lead</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads in View */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Leads in View</p>
              <p className="text-2xl font-bold mt-1">{leadsInView}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
