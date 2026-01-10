import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SuggestionCard } from './SuggestionCard';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { Loader2, Lightbulb } from 'lucide-react';

export function AISuggestionsDashboard() {
  const { data, isLoading, actOnSuggestion, dismissSuggestion } = useAISuggestions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { suggestions = [], stats = { pending: 0, acted: 0, dismissed: 0, successRate: 0 } } = data || {};
  const pending = suggestions.filter(s => s.status === 'pending');
  const acted = suggestions.filter(s => s.status === 'acted');
  const dismissed = suggestions.filter(s => s.status === 'dismissed');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Lightbulb className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acted Upon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dismissed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dismissed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(0)}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="acted">Acted ({acted.length})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({dismissed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No pending suggestions at the moment
              </CardContent>
            </Card>
          ) : (
            pending.map(suggestion => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                onAct={() => actOnSuggestion.mutate(suggestion.id)}
                onDismiss={(reason) => dismissSuggestion.mutate({ suggestionId: suggestion.id, reason })}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="acted" className="space-y-4 mt-4">
          {acted.map(suggestion => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </TabsContent>

        <TabsContent value="dismissed" className="space-y-4 mt-4">
          {dismissed.map(suggestion => (
            <SuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
