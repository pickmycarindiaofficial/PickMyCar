import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, TrendingDown, Target, CreditCard, Sparkles } from 'lucide-react';
import { useAIMarketAnalysis } from '@/hooks/useAIMarketAnalysis';
import { Skeleton } from '@/components/ui/skeleton';

export function AIAnalysisSection() {
  const { data: analysis, isLoading } = useAIMarketAnalysis();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Analysis PRO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Analysis PRO
        </CardTitle>
        <CardDescription>
          AI-powered insights for strategic decision making
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Fast Movers */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Fast Movers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis?.fastMovers && analysis.fastMovers.length > 0 ? (
                analysis.fastMovers.map((mover) => (
                  <div key={mover.id} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight">
                        {mover.brand} {mover.model}
                      </p>
                      <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950">
                        {mover.conversion_rate.toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mover.enquiries} leads from {mover.views} views
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No fast movers detected yet</p>
              )}
            </CardContent>
          </Card>

          {/* Trend Shift Alert */}
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-orange-500" />
                Trend Shift Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis?.trendShifts && analysis.trendShifts.length > 0 ? (
                analysis.trendShifts.map((trend, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight">
                        {trend.brand} {trend.model}
                      </p>
                      <Badge 
                        variant={trend.direction === 'up' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {trend.direction === 'up' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {Math.abs(trend.change_percentage)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {trend.current_week_views} views this week
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No significant trends detected</p>
              )}
            </CardContent>
          </Card>

          {/* 2-Week Forecast */}
          <Card className="border-purple-200 dark:border-purple-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                2-Week Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis?.forecasts && analysis.forecasts.length > 0 ? (
                analysis.forecasts.map((forecast, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight">
                        {forecast.brand} {forecast.model}
                      </p>
                      <Badge 
                        variant={
                          forecast.predicted_demand === 'high' 
                            ? 'default' 
                            : forecast.predicted_demand === 'medium'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {forecast.predicted_demand.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {forecast.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Building forecast model...</p>
              )}
            </CardContent>
          </Card>

          {/* Loan-Intent Hotspots */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                Loan-Intent Hotspots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis?.loanHotspots && analysis.loanHotspots.length > 0 ? (
                analysis.loanHotspots.map((hotspot, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight">
                        {hotspot.brand} {hotspot.model}
                      </p>
                      <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950">
                        {hotspot.loan_percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {hotspot.loan_enquiries} of {hotspot.total_enquiries} need financing
                    </p>
                    <p className="text-xs font-semibold text-primary">
                      Avg: ₹{(hotspot.avg_price / 100000).toFixed(2)}L
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No loan patterns detected yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Disclaimer */}
        <div className="mt-4 p-3 rounded-md bg-muted/50 border">
          <p className="text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 inline mr-1" />
            AI insights are based on recent market activity and behavioral patterns. 
            Use as guidance alongside your market expertise.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
