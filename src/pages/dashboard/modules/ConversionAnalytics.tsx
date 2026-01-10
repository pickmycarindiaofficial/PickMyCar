import { useState } from 'react';
import { useConversionFunnel } from '@/hooks/useConversionFunnel';
import { ConversionFunnelViz } from '@/components/analytics/ConversionFunnelViz';
import { DropOffAnalysis } from '@/components/analytics/DropOffAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

export default function ConversionAnalytics() {
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const { data, isLoading } = useConversionFunnel(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No conversion data available
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conversion Funnel Analytics</h1>
          <p className="text-muted-foreground">Track user journey and identify bottlenecks</p>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
              >
                Last 90 days
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <ConversionFunnelViz 
            data={data.funnelData} 
            totalSessions={data.totalSessions}
            conversionRate={data.overallConversionRate}
          />
        </Card>

        <Card className="md:col-span-2">
          <DropOffAnalysis reasons={data.dropOffReasons} />
        </Card>
      </div>
    </div>
  );
}
