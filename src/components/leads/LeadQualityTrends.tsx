import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function LeadQualityTrends() {
  // Mock data - in real implementation, fetch historical data
  const data = [
    { week: 'Week 1', avgScore: 45, hotLeads: 12, warmLeads: 28 },
    { week: 'Week 2', avgScore: 52, hotLeads: 18, warmLeads: 32 },
    { week: 'Week 3', avgScore: 58, hotLeads: 24, warmLeads: 35 },
    { week: 'Week 4', avgScore: 63, hotLeads: 30, warmLeads: 38 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Quality Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="week" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" name="Avg Score" strokeWidth={2} />
            <Line type="monotone" dataKey="hotLeads" stroke="#ef4444" name="Hot Leads" strokeWidth={2} />
            <Line type="monotone" dataKey="warmLeads" stroke="#f97316" name="Warm Leads" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
