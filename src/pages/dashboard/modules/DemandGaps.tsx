import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDemandGaps, useTrackDemandGapView, useRespondToDemandGap, type DemandGap } from '@/hooks/useDemandGaps';
import { useDealerListings } from '@/hooks/useDealerListings';
import { useDealerProfile } from '@/hooks/useDealerProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, TrendingUp, Snowflake, Search, Filter, Eye, MessageSquare, CheckCircle, X, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DemandGaps() {
  const [filters, setFilters] = useState({
    priority: 'all' as 'all' | 'high' | 'medium' | 'low',
    status: 'all',
    search: '',
  });

  const [selectedGap, setSelectedGap] = useState<DemandGap | null>(null);
  const [responseType, setResponseType] = useState<'have_cars' | 'dont_have' | 'can_source'>('have_cars');
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedCars, setSelectedCars] = useState<string[]>([]);

  const { data, isLoading } = useDemandGaps(filters);
  const { user } = useAuth();
  const { data: dealerListings } = useDealerListings(user?.id);
  const { data: dealerProfile } = useDealerProfile(user?.id);
  const trackView = useTrackDemandGapView();
  const respondMutation = useRespondToDemandGap();

  const handleViewDetails = (gap: DemandGap) => {
    setSelectedGap(gap);
    
    // Track view if not already viewed by this dealer
    const hasViewed = gap.dealer_views?.some((v: any) => v.dealer_id === dealerProfile?.id);
    if (!hasViewed && dealerProfile?.dealership_name) {
      trackView.mutate({
        demandGapId: gap.id,
        dealerName: dealerProfile.dealership_name,
      });
    }
  };

  const handleRespond = (gap: DemandGap, type: 'have_cars' | 'dont_have' | 'can_source') => {
    setSelectedGap(gap);
    setResponseType(type);
    setResponseMessage('');
    setSelectedCars([]);
  };

  const submitResponse = () => {
    if (!selectedGap || !dealerProfile?.dealership_name) return;

    respondMutation.mutate({
      demandGapId: selectedGap.id,
      responseType,
      message: responseMessage,
      matchedCars: selectedCars,
      dealerName: dealerProfile.dealership_name,
    }, {
      onSuccess: () => {
        setSelectedGap(null);
        setResponseMessage('');
        setSelectedCars([]);
      },
    });
  };

  const getPriorityIcon = (score: number) => {
    if (score >= 80) return <Flame className="h-4 w-4 text-red-500" />;
    if (score >= 50) return <TrendingUp className="h-4 w-4 text-orange-500" />;
    return <Snowflake className="h-4 w-4 text-blue-500" />;
  };

  const getPriorityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500">🔥 Hot</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">📌 Warm</Badge>;
    return <Badge variant="secondary">❄️ Cold</Badge>;
  };

  const groupedGaps = {
    high: data?.demandGaps.filter(g => g.priority_score >= 80) || [],
    medium: data?.demandGaps.filter(g => g.priority_score >= 50 && g.priority_score < 80) || [],
    low: data?.demandGaps.filter(g => g.priority_score < 50) || [],
  };

  if (isLoading) {
    return <div className="p-6">Loading demand gaps...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🎯 Demand Gaps</h1>
          <p className="text-muted-foreground">Real-time customer requirements matching your inventory</p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New (Unviewed)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.stats.new || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.stats.inProgress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.stats.converted || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by location, requirements..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filters.priority} onValueChange={(value: any) => setFilters({ ...filters, priority: value })}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* High Priority Section */}
      {groupedGaps.high.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-500" />
            High Priority ({groupedGaps.high.length})
          </h2>
          <div className="grid gap-4">
            {groupedGaps.high.map((gap) => (
              <DemandGapCard 
                key={gap.id} 
                gap={gap} 
                onViewDetails={handleViewDetails}
                onRespond={handleRespond}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Section */}
      {groupedGaps.medium.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Medium Priority ({groupedGaps.medium.length})
          </h2>
          <div className="grid gap-4">
            {groupedGaps.medium.map((gap) => (
              <DemandGapCard 
                key={gap.id} 
                gap={gap} 
                onViewDetails={handleViewDetails}
                onRespond={handleRespond}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Section */}
      {groupedGaps.low.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Snowflake className="h-5 w-5 text-blue-500" />
            Low Priority ({groupedGaps.low.length})
          </h2>
          <div className="grid gap-4">
            {groupedGaps.low.map((gap) => (
              <DemandGapCard 
                key={gap.id} 
                gap={gap} 
                onViewDetails={handleViewDetails}
                onRespond={handleRespond}
              />
            ))}
          </div>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedGap} onOpenChange={(open) => !open && setSelectedGap(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respond to Demand Gap</DialogTitle>
            <DialogDescription>
              {selectedGap?.note || 'Customer requirement'}
            </DialogDescription>
          </DialogHeader>

          {selectedGap && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Budget</Label>
                    <p className="font-medium">₹{selectedGap.budget_min?.toLocaleString()} - ₹{selectedGap.budget_max?.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="font-medium">{selectedGap.city || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Response Type</Label>
                <Select value={responseType} onValueChange={(value: any) => setResponseType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="have_cars">✅ I Have Matching Cars</SelectItem>
                    <SelectItem value="can_source">🔍 I Can Source This Car</SelectItem>
                    <SelectItem value="dont_have">❌ I Don't Have</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {responseType === 'have_cars' && dealerListings && dealerListings.length > 0 && (
                <div className="space-y-2">
                  <Label>Select Matching Cars</Label>
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg">
                    {dealerListings.slice(0, 10).map((car: any) => (
                      <div
                        key={car.id}
                        className={`p-2 border rounded cursor-pointer hover:border-primary ${
                          selectedCars.includes(car.id) ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => {
                          setSelectedCars(prev =>
                            prev.includes(car.id)
                              ? prev.filter(id => id !== car.id)
                              : [...prev, car.id]
                          );
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <Checkbox checked={selectedCars.includes(car.id)} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {car.brand_name} {car.model_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ₹{car.expected_price?.toLocaleString()} | {car.year_of_make}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Message to Customer (Optional)</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedGap(null)}>
              Cancel
            </Button>
            <Button onClick={submitResponse} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? 'Sending...' : 'Send Response'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DemandGapCard({
  gap,
  onViewDetails,
  onRespond,
}: {
  gap: DemandGap;
  onViewDetails: (gap: DemandGap) => void;
  onRespond: (gap: DemandGap, type: 'have_cars' | 'dont_have' | 'can_source') => void;
}) {
  const getPriorityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500 text-white">🔥 Hot</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500 text-white">📌 Warm</Badge>;
    return <Badge variant="secondary">❄️ Cold</Badge>;
  };

  const hasResponded = gap.dealer_responses?.length > 0;

  return (
    <Card className={`${gap.view_count === 0 ? 'border-primary' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {getPriorityBadge(gap.priority_score)}
              {gap.view_count === 0 && <Badge variant="outline" className="text-green-600">New</Badge>}
              {hasResponded && <Badge variant="outline" className="text-blue-600">Responded</Badge>}
            </div>
            <CardTitle className="text-lg">
              ₹{gap.budget_min?.toLocaleString()} - ₹{gap.budget_max?.toLocaleString()}
              {gap.city && ` | ${gap.city}`}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {gap.note || 'No specific requirements mentioned'}
            </CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <Clock className="h-3 w-3 inline mr-1" />
            {formatDistanceToNow(new Date(gap.created_at), { addSuffix: true })}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {gap.view_count} views
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              {gap.response_count} responses
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="default" onClick={() => onRespond(gap, 'have_cars')}>
              <CheckCircle className="h-4 w-4 mr-1" />
              I Have Cars
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRespond(gap, 'can_source')}>
              Can Source
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onRespond(gap, 'dont_have')}>
              <X className="h-4 w-4 mr-1" />
              Don't Have
            </Button>
            <Button size="sm" variant="outline" onClick={() => onViewDetails(gap)}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
