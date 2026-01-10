import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { DropOffReason } from '@/hooks/useConversionFunnel';

interface DropOffAnalysisProps {
  reasons: DropOffReason[];
}

export function DropOffAnalysis({ reasons }: DropOffAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Drop-Off Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reasons.slice(0, 5).map((reason, index) => (
            <div key={reason.reason} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                <div>
                  <div className="font-medium">{reason.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    {reason.count} occurrences
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-lg">
                {reason.percentage.toFixed(1)}%
              </Badge>
            </div>
          ))}

          {reasons.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No drop-off data available
            </div>
          )}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted">
          <div className="text-sm font-medium mb-2">Recommendations</div>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Focus on reducing friction at high drop-off stages</li>
            <li>A/B test different CTAs and page layouts</li>
            <li>Improve page load times and mobile experience</li>
            <li>Clarify pricing and contact information earlier</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
