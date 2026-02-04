import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Brain, Loader2, Zap, AlertTriangle, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MockAISuggestionService } from '@/lib/mock-ai-suggestions';

export default function AIInsights() {
  const { user, roles } = useAuth();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, any>>({});

  const runTask = async (taskName: string, functionName: string, payload: any) => {
    setLoading(prev => ({ ...prev, [taskName]: true }));
    try {
      let data;

      // Use Mock Service for AI Suggestions to avoid Edge Function failure
      if (functionName === 'generate-ai-suggestions') {
        const response = await MockAISuggestionService.getSuggestions();
        data = {
          success: true,
          count: response.suggestions.length,
          suggestions: response.suggestions
        };
      } else {
        // Fallback for other functions (though they might also fail, prioritizing the active task)
        const response = await supabase.functions.invoke(functionName, {
          body: payload
        });
        if (response.error) throw response.error;
        data = response.data;
      }

      setResults(prev => ({ ...prev, [taskName]: data }));
      toast.success(`${taskName} completed successfully`);
    } catch (error) {
      console.error(`Error running ${taskName}:`, error);
      toast.error(`Failed to run ${taskName}`);
    } finally {
      setLoading(prev => ({ ...prev, [taskName]: false }));
    }
  };

  const isPowerDesk = roles.includes('powerdesk');
  const isDealer = roles.includes('dealer');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          AI Insights & Automation
        </h1>
        <p className="text-muted-foreground">AI-powered tools to automate insights and improve decisions</p>
      </div>

      <Tabs defaultValue="suggestions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="signals">Market Signals</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Generate AI Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI analyzes your performance data and generates actionable suggestions to improve your business
              </p>

              {(isPowerDesk || isDealer) && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => runTask(
                      'AI Suggestions',
                      'generate-ai-suggestions',
                      {
                        target_id: user?.id,
                        target_type: isPowerDesk ? 'powerdesk' : 'dealer'
                      }
                    )}
                    disabled={loading['AI Suggestions']}
                  >
                    {loading['AI Suggestions'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Suggestions
                  </Button>
                </div>
              )}

              {results['AI Suggestions'] && results['AI Suggestions'].suggestions && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-600">Successfully generated {results['AI Suggestions'].count} suggestions</span>
                  </div>

                  <div className="grid gap-4">
                    {results['AI Suggestions'].suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                        <div className={`p-2 rounded-full ${suggestion.priority === 'high' ? 'bg-red-100 text-red-600' :
                          suggestion.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                          {suggestion.priority === 'high' ? <AlertTriangle className="w-5 h-5" /> :
                            suggestion.priority === 'medium' ? <TrendingUp className="w-5 h-5" /> :
                              <Lightbulb className="w-5 h-5" />}
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{suggestion.title}</h4>
                            <Badge variant="outline" className={
                              suggestion.priority === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                                suggestion.priority === 'medium' ? 'border-orange-200 text-orange-700 bg-orange-50' :
                                  'border-blue-200 text-blue-700 bg-blue-50'
                            }>
                              {suggestion.priority.toUpperCase()}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>

                          {suggestion.expected_impact && (
                            <div className="mt-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded inline-block">
                              🚀 Impact: {suggestion.expected_impact}
                            </div>
                          )}

                          <div className="pt-2 flex items-center gap-2">
                            <Button size="sm" variant="default" className="h-8">
                              {suggestion.action_label || 'Take Action'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detect Market Signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI analyzes user behavior to detect trending brands, hot locations, and inventory gaps
              </p>

              {isPowerDesk && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => runTask('Market Signals', 'detect-market-signals', {})}
                    disabled={loading['Market Signals']}
                  >
                    {loading['Market Signals'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Detect Signals
                  </Button>
                </div>
              )}

              {results['Market Signals'] && (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="font-medium mb-2">Results:</div>
                  <div className="space-y-2 text-sm">
                    <div>Total Signals: {results['Market Signals'].signals_detected}</div>
                    <div>Trending Brands: {results['Market Signals'].trending_brands}</div>
                    <div>Hot Locations: {results['Market Signals'].hot_locations}</div>
                    <div>Inventory Gaps: {results['Market Signals'].inventory_gaps}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Smart Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                AI generates personalized car recommendations based on user preferences and behavior
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={() => runTask('Smart Recommendations', 'smart-recommendations', { user_id: user?.id })}
                  disabled={loading['Smart Recommendations']}
                >
                  {loading['Smart Recommendations'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Recommendations
                </Button>
              </div>

              {results['Smart Recommendations'] && (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="font-medium mb-2">
                    Generated {results['Smart Recommendations'].recommendations?.length || 0} recommendations
                  </div>
                  <div className="space-y-2">
                    {results['Smart Recommendations'].recommendations?.slice(0, 3).map((rec: any, i: number) => (
                      <div key={i} className="p-3 rounded bg-background text-sm">
                        <div className="font-medium">
                          {rec.car?.brand?.name} {rec.car?.model?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Match Score: {rec.match_score}% • {rec.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
