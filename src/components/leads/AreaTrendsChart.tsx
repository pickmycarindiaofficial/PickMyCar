import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';

interface AreaTrendData {
  city: string;
  hatchbacks: number;
  sedans: number;
  suvs: number;
}

interface AreaTrendsChartProps {
  data: AreaTrendData[];
}

export function AreaTrendsChart({ data }: AreaTrendsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Area Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No area trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="city" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="hatchbacks" stackId="a" fill="hsl(var(--chart-1))" />
              <Bar dataKey="sedans" stackId="a" fill="hsl(var(--chart-2))" />
              <Bar dataKey="suvs" stackId="a" fill="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
