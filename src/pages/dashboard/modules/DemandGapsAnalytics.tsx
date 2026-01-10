import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useDemandGaps, useUpdateDemandGapStatus, type DemandGap } from '@/hooks/useDemandGaps';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, CheckCircle, Clock, Eye, MessageSquare, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DemandGapsAdmin() {
  const [selectedGap, setSelectedGap] = useState<DemandGap | null>(null);
  const [statusUpdate, setStatusUpdate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data, isLoading } = useDemandGaps({});
  const updateStatus = useUpdateDemandGapStatus();

  const handleUpdateStatus = () => {
    if (!selectedGap) return;

    updateStatus.mutate({
      demandGapId: selectedGap.id,
      status: statusUpdate,
      adminNotes,
    }, {
      onSuccess: () => {
        setSelectedGap(null);
        setAdminNotes('');
      },
    });
  };

  // Calculate dealer performance
  const dealerPerformance = data?.demandGaps.reduce((acc: any, gap) => {
    gap.dealer_responses?.forEach((response: any) => {
      if (!acc[response.dealer_id]) {
        acc[response.dealer_id] = {
          dealer_name: response.dealer_name,
          viewed: 0,
          responded: 0,
        };
      }
      acc[response.dealer_id].responded++;
    });

    gap.dealer_views?.forEach((view: any) => {
      if (!acc[view.dealer_id]) {
        acc[view.dealer_id] = {
          dealer_name: view.dealer_name,
          viewed: 0,
          responded: 0,
        };
      }
      acc[view.dealer_id].viewed++;
    });

    return acc;
  }, {});

  const topDealers = Object.entries(dealerPerformance || {})
    .map(([id, stats]: [string, any]) => ({
      id,
      ...stats,
      responseRate: stats.viewed > 0 ? Math.round((stats.responded / stats.viewed) * 100) : 0,
    }))
    .sort((a, b) => b.responded - a.responded)
    .slice(0, 5);

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🎯 Demand Gap Analytics</h1>
        <p className="text-muted-foreground">Monitor dealer responses and conversion rates</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Demand Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data?.demandGaps.filter(g => g.status === 'open').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.stats.inProgress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.stats.converted || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.stats.total ? Math.round((data.stats.converted / data.stats.total) * 100) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3h</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dealer Leaderboard */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🏆 Dealer Performance
            </CardTitle>
            <CardDescription>Top responding dealers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDealers.map((dealer, index) => (
                <div key={dealer.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground">#{index + 1}</div>
                    <div>
                      <p className="font-medium text-sm">{dealer.dealer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {dealer.viewed} viewed | {dealer.responded} responded
                      </p>
                    </div>
                  </div>
                  <Badge variant={dealer.responseRate >= 70 ? 'default' : 'secondary'}>
                    {dealer.responseRate}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Demand Gaps */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Demand Gaps</CardTitle>
            <CardDescription>Latest customer requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.demandGaps.slice(0, 10).map((gap) => (
                <div
                  key={gap.id}
                  className="p-3 border rounded-lg hover:border-primary cursor-pointer"
                  onClick={() => setSelectedGap(gap)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={
                          gap.priority_score >= 80 ? 'bg-red-500' :
                          gap.priority_score >= 50 ? 'bg-orange-500' : 'bg-gray-500'
                        }>
                          Score: {gap.priority_score}
                        </Badge>
                        <Badge variant="outline">{gap.status}</Badge>
                      </div>
                      <p className="font-medium text-sm">
                        ₹{gap.budget_min?.toLocaleString()} - ₹{gap.budget_max?.toLocaleString()} | {gap.city}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {gap.note || 'No specific requirements'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(gap.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {gap.view_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {gap.response_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {gap.dealer_views?.length || 0} dealers
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedGap} onOpenChange={(open) => !open && setSelectedGap(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Demand Gap Details</DialogTitle>
          </DialogHeader>

          {selectedGap && (
            <div className="space-y-4">
              {/* Customer Requirements */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Budget</Label>
                    <p className="font-medium">₹{selectedGap.budget_min?.toLocaleString()} - ₹{selectedGap.budget_max?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="font-medium">{selectedGap.city || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Priority Score</Label>
                    <p className="font-medium">{selectedGap.priority_score}/100</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge>{selectedGap.status}</Badge>
                  </div>
                </div>
                {selectedGap.note && (
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">Requirements</Label>
                    <p className="text-sm mt-1">{selectedGap.note}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Dealer Activity */}
              <div>
                <h4 className="font-semibold mb-3">Dealer Activity</h4>
                <div className="space-y-2">
                  {selectedGap.dealer_responses?.map((response: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[#edf1ff] border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{response.dealer_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{response.dealer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(response.responded_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-green-500">
                          {response.response_type === 'have_cars' ? '✓ Has Cars' :
                           response.response_type === 'can_source' ? '🔍 Can Source' : '❌ No Match'}
                        </Badge>
                      </div>
                      {response.message && (
                        <p className="text-sm mt-2 text-muted-foreground">{response.message}</p>
                      )}
                      {response.matched_cars?.length > 0 && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          {response.matched_cars.length} matching cars selected
                        </p>
                      )}
                    </div>
                  ))}

                  {selectedGap.dealer_views?.filter((view: any) =>
                    !selectedGap.dealer_responses?.some((r: any) => r.dealer_id === view.dealer_id)
                  ).map((view: any, idx: number) => (
                    <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{view.dealer_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{view.dealer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Viewed {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">👁️ Viewed Only</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Admin Actions */}
              <div className="space-y-3">
                <Label>Update Status</Label>
                <Select value={statusUpdate || selectedGap.status} onValueChange={setStatusUpdate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <div>
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending}>
                    {updateStatus.isPending ? 'Updating...' : 'Update Status'}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedGap(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
