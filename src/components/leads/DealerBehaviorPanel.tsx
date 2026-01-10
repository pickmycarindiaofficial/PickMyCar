import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Target, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DealerBehaviorPanelProps {
  avgReactionTimeMinutes: number;
  followUpDiscipline: number;
  tips?: string[];
}

export function DealerBehaviorPanel({
  avgReactionTimeMinutes,
  followUpDiscipline,
  tips = []
}: DealerBehaviorPanelProps) {
  const formatReactionTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const defaultTips = [
    'Respond within 15 minutes to hot leads',
    'Follow up within 24 hours if no response',
    'Use WhatsApp for better engagement',
    'Personalize messages based on user preferences'
  ];

  const displayTips = tips.length > 0 ? tips : defaultTips;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Your Behavior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Avg Reaction Time</span>
            </div>
            <Badge variant={avgReactionTimeMinutes < 30 ? 'default' : 'secondary'}>
              {formatReactionTime(avgReactionTimeMinutes)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Follow-up Discipline</span>
            </div>
            <Badge variant={followUpDiscipline >= 70 ? 'default' : 'secondary'}>
              {followUpDiscipline}%
            </Badge>
          </div>
        </div>

        {/* Tips */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Tips to Improve
          </h4>
          <ul className="space-y-2">
            {displayTips.map((tip, index) => (
              <li key={index} className="text-xs flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
