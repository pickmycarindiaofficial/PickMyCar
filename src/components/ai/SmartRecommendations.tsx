import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Recommendation {
  car_id: string;
  match_score: number;
  reasoning: string;
  why_good_fit?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  car: any;
}

export function SmartRecommendations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const generateRecommendations = async () => {
    if (!user?.id) {
      toast.error('Please login to get recommendations');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-recommendations', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      setRecommendations(data.recommendations || []);
      toast.success(`Generated ${data.recommendations?.length || 0} recommendations`);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-orange-500';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <Button onClick={generateRecommendations} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Click "Generate" to get personalized car recommendations
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={rec.car_id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-lg font-bold">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-semibold">
                        {rec.car.brand?.name} {rec.car.model?.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ₹{rec.car.expected_price?.toLocaleString()} • {rec.car.city?.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(rec.match_score)}`}>
                      {rec.match_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">Match Score</div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Why This Car?
                    </div>
                    <p className="text-muted-foreground mt-1">{rec.reasoning}</p>
                  </div>

                  {rec.why_good_fit && (
                    <div>
                      <div className="font-medium">Perfect Match Because:</div>
                      <p className="text-muted-foreground mt-1">{rec.why_good_fit}</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="default" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline">
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
