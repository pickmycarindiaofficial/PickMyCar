import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, MapPin, AlertCircle, DollarSign } from 'lucide-react';
import { MarketSignal } from '@/hooks/useMarketSignals';
import { format } from 'date-fns';

interface MarketSignalsFeedProps {
  signals: MarketSignal[];
}

const getSignalConfig = (type: string) => {
  const configs: Record<string, { icon: any; color: string; label: string }> = {
    trending_brand: { icon: TrendingUp, color: 'text-red-500', label: 'Trending Brand' },
    hot_location: { icon: MapPin, color: 'text-orange-500', label: 'Hot Location' },
    inventory_gap: { icon: AlertCircle, color: 'text-yellow-500', label: 'Inventory Gap' },
    price_trend: { icon: DollarSign, color: 'text-green-500', label: 'Price Trend' }
  };
  return configs[type] || configs.trending_brand;
};

export function MarketSignalsFeed({ signals }: MarketSignalsFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Signals Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {signals.slice(0, 10).map((signal) => {
            const config = getSignalConfig(signal.signal_type);
            const Icon = config.icon;
            const TrendIcon = signal.trend_direction === 'up' ? TrendingUp : signal.trend_direction === 'down' ? TrendingDown : null;

            return (
              <div key={signal.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className={`${config.color} mt-1`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {TrendIcon && <TrendIcon className={`h-3 w-3 ${signal.trend_direction === 'up' ? 'text-green-500' : 'text-red-500'}`} />}
                  </div>
                  <div className="font-medium">{signal.entity_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {signal.change_percentage > 0 ? '+' : ''}{signal.change_percentage.toFixed(1)}% change • 
                    {signal.confidence_score.toFixed(0)}% confidence
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(signal.detected_at), 'MMM d, HH:mm')}
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  Investigate
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
