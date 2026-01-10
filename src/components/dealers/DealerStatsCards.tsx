import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Clock, CheckCircle, TrendingUp } from 'lucide-react';

interface DealerStatsCardsProps {
  totalDealers: number;
  pendingApplications: number;
  activePlans: number;
  thisMonth: number;
}

export function DealerStatsCards({ 
  totalDealers, 
  pendingApplications, 
  activePlans, 
  thisMonth 
}: DealerStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Dealers</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDealers}</div>
          <p className="text-xs text-muted-foreground">Active dealer accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingApplications}</div>
          <p className="text-xs text-muted-foreground">Awaiting review</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activePlans}</div>
          <p className="text-xs text-muted-foreground">With subscriptions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{thisMonth}</div>
          <p className="text-xs text-muted-foreground">New dealers</p>
        </CardContent>
      </Card>
    </div>
  );
}
