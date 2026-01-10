import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { TopLead } from '@/hooks/useLeadIntelligence';
import { ArrowRight, Flame, Thermometer, Snowflake } from 'lucide-react';
import { format } from 'date-fns';

interface TopLeadsTableProps {
  leads: TopLead[];
}

const getIntentIcon = (level: string) => {
  switch (level) {
    case 'hot': return <Flame className="h-3 w-3 text-destructive" />;
    case 'warm': return <Thermometer className="h-3 w-3 text-orange-500" />;
    default: return <Snowflake className="h-3 w-3 text-primary" />;
  }
};

const getIntentBadge = (level: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    hot: 'destructive',
    warm: 'default',
    cold: 'secondary'
  };
  return <Badge variant={variants[level] || 'secondary'}>{level}</Badge>;
};

export function TopLeadsTable({ leads }: TopLeadsTableProps) {
  const columns: ColumnDef<TopLead>[] = [
    {
      accessorKey: 'user_name',
      header: 'User',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.user_name || 'Unknown'}</div>
      )
    },
    {
      accessorKey: 'car_name',
      header: 'Car',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{row.original.car_name}</div>
      )
    },
    {
      accessorKey: 'ai_score',
      header: 'AI Score',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="text-lg font-bold">{row.original.ai_score.toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">/100</div>
        </div>
      )
    },
    {
      accessorKey: 'intent_level',
      header: 'Intent',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {getIntentIcon(row.original.intent_level)}
          {getIntentBadge(row.original.intent_level)}
        </div>
      )
    },
    {
      accessorKey: 'buying_timeline',
      header: 'Timeline',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.buying_timeline.replace('_', ' ')}
        </Badge>
      )
    },
    {
      accessorKey: 'conversion_probability',
      header: 'Conv. Prob.',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.conversion_probability.toFixed(0)}%</div>
      )
    },
    {
      accessorKey: 'enriched_at',
      header: 'Last Updated',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground">
          {format(new Date(row.original.enriched_at), 'MMM d, HH:mm')}
        </div>
      )
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button size="sm" variant="ghost">
          View <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Leads (Highest AI Score)</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={leads} />
      </CardContent>
    </Card>
  );
}
