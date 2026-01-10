import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { DealerMetrics } from '@/hooks/useDealerBehaviorMetrics';

interface DealerLeaderboardProps {
  dealers: DealerMetrics[];
}

export function DealerLeaderboard({ dealers }: DealerLeaderboardProps) {
  const topDealers = dealers.slice(0, 10);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-orange-600" />;
      default: return <div className="h-5 w-5 flex items-center justify-center text-muted-foreground font-bold">{index + 1}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dealer Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topDealers.map((dealer, index) => (
            <div key={dealer.dealer_id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                {getRankIcon(index)}
                <div>
                  <div className="font-medium">{dealer.dealer_name || 'Unknown Dealer'}</div>
                  <div className="text-xs text-muted-foreground">
                    Response: {dealer.response_rate.toFixed(0)}% • Conversion: {dealer.conversion_rate.toFixed(0)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-lg font-bold">
                  {dealer.quality_score.toFixed(0)}
                </Badge>
                {dealer.streak_days > 0 && (
                  <Badge variant="secondary">
                    🔥 {dealer.streak_days}d streak
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
