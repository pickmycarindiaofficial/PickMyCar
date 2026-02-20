import { useProfitIntelligence } from '@/hooks/useProfitIntelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, ExternalLink, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const PRIORITY_COLORS = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-blue-500',
};

const PRIORITY_ICONS = {
  high: AlertTriangle,
  medium: TrendingUp,
  low: Lightbulb,
};

export default function AISuggestions() {
  const navigate = useNavigate();
  const { actions, isLoading } = useProfitIntelligence();

  const handleAccept = async (suggestionId: string, actionUrl?: string) => {
    try {
      await updateSuggestionStatus(suggestionId, 'accepted');
      toast({
        title: 'Suggestion Accepted',
        description: 'You have accepted this AI suggestion',
      });

      // Navigate to action URL if provided
      if (actionUrl) {
        navigate(actionUrl);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept suggestion',
        variant: 'destructive',
      });
    }
  };

  const handleAction = async (carId: string, actionType: string) => {
    toast({
      title: 'Action Triggered',
      description: 'Redirecting to listing editor...',
    });
    // Hardcoded for now, will link to actual edit panel soon
    navigate(`/dashboard/my-listings`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No error state needed natively, the hook returns empty array if fails
  const pendingActions = actions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profit Intelligence Layer</h1>
        <p className="text-muted-foreground">Strategic actions calculated by the Deterministic Engine</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Strategic Action Queue ({pendingActions.length})</h2>
        {pendingActions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg">Your inventory is perfectly optimized</p>
              <p className="text-sm">Enjoy maximum ROI on your active listings.</p>
            </CardContent>
          </Card>
        ) : (
          pendingActions.map((action, idx) => {
            const isHighUrgency = action.urgency > 80;
            const PriorityIcon = isHighUrgency ? AlertTriangle : Calculator;
            const priorityLabel = isHighUrgency ? 'High Priority' : 'Optimization';
            const colorClass = isHighUrgency ? PRIORITY_COLORS.high : PRIORITY_COLORS.medium;

            return (
              <Card key={`${action.car_id}-${idx}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10`}>
                        <PriorityIcon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {action.action_type === 'liquidate' ? 'Liquidate Dead Capital' : 'Price Optimization Required'}
                          </CardTitle>
                          <Badge variant="outline" className={`${colorClass} text-white`}>
                            {priorityLabel}
                          </Badge>
                        </div>
                        <CardDescription className="font-semibold text-foreground">
                          {/* We injected car_title in the hook */}
                          Vehicle: {(action as any).car_title || action.car_id}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-muted rounded-lg border-l-4 border-l-primary">
                    <p className="text-sm text-foreground">{action.recommendation_text}</p>
                    {action.expected_profit_gain > 0 && (
                      <p className="text-sm font-semibold mt-2 text-green-600">
                        Expected Net Impact +₹{action.expected_profit_gain.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAction(action.car_id, action.action_type)}
                      className="flex-1"
                    >
                      Take Action <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
