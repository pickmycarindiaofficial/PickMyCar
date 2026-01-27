import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AISuggestion } from '@/hooks/useAISuggestions';
import { format } from 'date-fns';

interface SuggestionCardProps {
  suggestion: AISuggestion;
  onAct?: () => void;
  onDismiss?: (reason: string) => void;
}

export function SuggestionCard({ suggestion, onAct, onDismiss }: SuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const priorityColors: Record<string, string> = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary'
  };

  const handleDismiss = () => {
    if (dismissReason.trim() && onDismiss) {
      onDismiss(dismissReason);
      setDismissing(false);
      setDismissReason('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Badge variant={priorityColors[suggestion.priority] as any}>
                {suggestion.priority} priority
              </Badge>
              <Badge variant="outline">{suggestion.suggestion_type}</Badge>
              {suggestion.status !== 'pending' && (
                <Badge variant="secondary">{suggestion.status}</Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold">{suggestion.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-muted-foreground">{suggestion.description}</p>

        {expanded && (
          <>
            {suggestion.reasoning && (
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-sm font-medium mb-1">Reasoning</div>
                <div className="text-sm text-muted-foreground">{suggestion.reasoning}</div>
              </div>
            )}

            {suggestion.expected_impact && (
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="font-medium">Expected Impact</div>
                  <div className="text-muted-foreground">{suggestion.expected_impact}</div>
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Created: {format(new Date(suggestion.created_at), 'MMM d, yyyy HH:mm')}
            </div>
          </>
        )}

        {dismissing && (
          <div className="space-y-2">
            <Textarea
              placeholder="Why are you dismissing this suggestion?"
              value={dismissReason}
              onChange={(e) => setDismissReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
      </CardContent>

      {suggestion.status === 'pending' && (onAct || onDismiss) && (
        <CardFooter className="flex gap-2">
          {!dismissing ? (
            <>
              {onAct && (
                <Button onClick={onAct} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  {suggestion.action_label}
                </Button>
              )}
              {onDismiss && (
                <Button variant="outline" onClick={() => setDismissing(true)}>
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={handleDismiss} variant="destructive">
                Confirm Dismiss
              </Button>
              <Button variant="outline" onClick={() => setDismissing(false)}>
                Cancel
              </Button>
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
