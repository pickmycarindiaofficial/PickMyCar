import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LeadsByTimeline } from '@/hooks/useLeadIntelligence';

interface BuyingTimelineFunnelProps {
  data: LeadsByTimeline[];
}

const TIMELINE_LABELS: Record<string, string> = {
  immediate: 'Immediate',
  '1-2_weeks': '1-2 Weeks',
  '1_month': '1 Month',
  '3_months': '3 Months',
  exploring: 'Exploring'
};

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export function BuyingTimelineFunnel({ data }: BuyingTimelineFunnelProps) {
  const chartData = data.map(item => ({
    name: TIMELINE_LABELS[item.timeline] || item.timeline,
    count: item.count,
    conversionRate: item.conversionRate.toFixed(1)
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buying Timeline Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
