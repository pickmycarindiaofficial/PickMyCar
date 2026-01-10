import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface InventoryGap {
  id: string;
  brand: string;
  model: string;
  demand_score: number;
  search_count: number;
  unmet_lead_count: number;
  suggestions: string;
  urgency: 'high' | 'medium' | 'low';
}

interface InventoryGapAlertsProps {
  gaps: InventoryGap[];
  isLoading?: boolean;
}

export function InventoryGapAlerts({ gaps, isLoading }: InventoryGapAlertsProps) {
  const getProgressColor = (score: number) => {
    if (score >= 70) return 'bg-destructive';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Critical Inventory Gaps
          </CardTitle>
          <CardDescription>People searched, not in stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Loading inventory gap analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Critical Inventory Gaps
        </CardTitle>
        <CardDescription>
          People searched, not in stock - High demand segments where you're losing business
        </CardDescription>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">No critical gaps detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your inventory matches market demand well
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[15%]">Brand</TableHead>
                <TableHead className="w-[15%]">Model</TableHead>
                <TableHead className="w-[30%]">Demand Score</TableHead>
                <TableHead className="w-[40%]">Suggestion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gaps.map((gap) => (
                <TableRow key={gap.id}>
                  <TableCell className="font-medium">{gap.brand}</TableCell>
                  
                  <TableCell>{gap.model || '-'}</TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${getProgressColor(gap.demand_score)}`}
                            style={{ width: `${gap.demand_score}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold min-w-[3rem] text-right">
                          {gap.demand_score}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {gap.search_count} searches • {gap.unmet_lead_count} unmet leads
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                    {gap.suggestions}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
