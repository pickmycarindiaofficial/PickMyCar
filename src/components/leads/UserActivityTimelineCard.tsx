import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Sparkles } from 'lucide-react';
import { TimelineActivity, LearnedPreference } from '@/hooks/useUserActivityTimeline';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserActivityTimelineCardProps {
  userName: string;
  carInterest: string;
  hotnessScore: number;
  activities: TimelineActivity[];
  learnedPreferences: LearnedPreference;
}

export function UserActivityTimelineCard({
  userName,
  carInterest,
  hotnessScore,
  activities,
  learnedPreferences
}: UserActivityTimelineCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{userName}</CardTitle>
            <p className="text-sm text-muted-foreground">{carInterest}</p>
          </div>
          <Badge variant={hotnessScore >= 80 ? 'destructive' : 'default'}>
            {hotnessScore} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </h4>
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p>{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* System Learned */}
        <div className="pt-3 border-t">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            System Learned
          </h4>
          <div className="space-y-1 text-xs">
            {learnedPreferences.budget_range && (
              <p>Budget: {learnedPreferences.budget_range}</p>
            )}
            {learnedPreferences.preferred_brands && learnedPreferences.preferred_brands.length > 0 && (
              <p>Prefers: {learnedPreferences.preferred_brands.join(', ')}</p>
            )}
            {learnedPreferences.financing_interest && (
              <p>Interested in financing</p>
            )}
            {!learnedPreferences.budget_range && 
             !learnedPreferences.preferred_brands?.length && 
             !learnedPreferences.financing_interest && (
              <p className="text-muted-foreground">No preferences learned yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
