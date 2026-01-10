import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DealerMetric {
  dealer_name: string;
  avg_response_time_minutes: number;
  hot_lead_win_rate: number;
}

interface DealerLeaderboardTableProps {
  dealers: DealerMetric[];
}

export function DealerLeaderboardTable({ dealers }: DealerLeaderboardTableProps) {
  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-sm font-medium">{index + 1}</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Dealer Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dealers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No dealer metrics available
          </div>
        ) : (
          <div className="space-y-3">
            {dealers.slice(0, 10).map((dealer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(index)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{dealer.dealer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Reacts in {formatResponseTime(dealer.avg_response_time_minutes)}
                    </p>
                  </div>
                </div>
                <Badge variant={dealer.hot_lead_win_rate >= 70 ? 'default' : 'secondary'}>
                  {dealer.hot_lead_win_rate}%
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
