import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FunnelStageData } from '@/hooks/useConversionFunnel';

interface ConversionFunnelVizProps {
  data: FunnelStageData[];
  totalSessions: number;
  conversionRate: number;
}

const STAGE_LABELS: Record<string, string> = {
  view: 'Page View',
  interest: 'Showed Interest',
  engage: 'Engaged',
  intent: 'Purchase Intent',
  convert: 'Converted'
};

export function ConversionFunnelViz({ data, totalSessions, conversionRate }: ConversionFunnelVizProps) {
  const maxCount = data[0]?.count || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <div className="text-sm text-muted-foreground">
          {totalSessions} total sessions • {conversionRate.toFixed(1)}% overall conversion rate
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((stage, index) => {
            const widthPercent = (stage.count / maxCount) * 100;
            const isLast = index === data.length - 1;

            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{STAGE_LABELS[stage.stage] || stage.stage}</div>
                  <div className="text-muted-foreground">
                    {stage.count.toLocaleString()} ({((stage.count / totalSessions) * 100).toFixed(1)}%)
                  </div>
                </div>
                
                <div className="relative h-12 flex items-center">
                  <div 
                    className="h-full rounded-lg bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-medium transition-all"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {widthPercent > 20 && `${stage.conversionRate.toFixed(0)}%`}
                  </div>
                </div>

                {!isLast && stage.dropOffRate > 0 && (
                  <div className="text-xs text-destructive pl-2">
                    ↓ {stage.dropOffRate.toFixed(1)}% drop-off
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
