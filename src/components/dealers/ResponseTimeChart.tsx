import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function ResponseTimeChart() {
  // Mock data - in real implementation, calculate from dealer_behavior_metrics
  const data = [
    { range: '<30 min', count: 45, color: '#22c55e' },
    { range: '30-60 min', count: 32, color: '#84cc16' },
    { range: '1-2 hr', count: 18, color: '#eab308' },
    { range: '2-4 hr', count: 12, color: '#f97316' },
    { range: '4+ hr', count: 8, color: '#ef4444' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="range" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
