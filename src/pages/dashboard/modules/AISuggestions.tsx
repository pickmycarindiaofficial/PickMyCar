import { useRealtimeAISuggestions } from '@/hooks/useRealtimeAISuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, X, ExternalLink } from 'lucide-react';
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
  const { suggestions, isLoading, error, updateSuggestionStatus } = useRealtimeAISuggestions();

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

  const handleDismiss = async (suggestionId: string) => {
    try {
      await updateSuggestionStatus(suggestionId, 'dismissed', 'Not relevant');
      toast({
        title: 'Suggestion Dismissed',
        description: 'This suggestion has been dismissed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss suggestion',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">
          Error loading AI suggestions. Please try again.
        </CardContent>
      </Card>
    );
  }

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Suggestions</h1>
        <p className="text-muted-foreground">Smart recommendations powered by AI to improve your business</p>
      </div>

      {/* Pending Suggestions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">New Suggestions ({pendingSuggestions.length})</h2>
        {pendingSuggestions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg">No new suggestions at the moment</p>
              <p className="text-sm">Check back later for AI-powered insights</p>
            </CardContent>
          </Card>
        ) : (
          pendingSuggestions.map((suggestion) => {
            const PriorityIcon = PRIORITY_ICONS[suggestion.priority];
            return (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${PRIORITY_COLORS[suggestion.priority]} bg-opacity-10`}>
                        <PriorityIcon className={`h-5 w-5 ${PRIORITY_COLORS[suggestion.priority].replace('bg-', 'text-')}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <Badge variant="outline" className={`${PRIORITY_COLORS[suggestion.priority]} text-white`}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <CardDescription>{suggestion.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {suggestion.expected_impact && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Expected Impact:</p>
                      <p className="text-sm text-muted-foreground">{suggestion.expected_impact}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleAccept(suggestion.id, suggestion.action_url)}
                      className="flex-1"
                    >
                      {suggestion.action_label || 'Take Action'}
                      {suggestion.action_url && <ExternalLink className="ml-2 h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDismiss(suggestion.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Accepted Suggestions */}
      {acceptedSuggestions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Accepted Suggestions ({acceptedSuggestions.length})</h2>
          {acceptedSuggestions.map((suggestion) => (
            <Card key={suggestion.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                  <Badge variant="outline" className="ml-auto">Accepted</Badge>
                </div>
                <CardDescription>{suggestion.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
