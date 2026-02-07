import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDealerEnquiries } from '@/hooks/useEnquiries';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { LeadDetailsDialog } from '@/components/leads/LeadDetailsDialog';
import { LeadStatsCards } from '@/components/leads/LeadStatsCards';
import { LeadScoringOverview } from '@/components/leads/LeadScoringOverview';
import { BuyingTimelineFunnel } from '@/components/leads/BuyingTimelineFunnel';
import { LeadQualityTrends } from '@/components/leads/LeadQualityTrends';
import { useLeadIntelligence } from '@/hooks/useLeadIntelligence';

export default function Leads() {
  const { user, hasRole } = useAuth();
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Determine the correct dealer ID to fetch enquiries for
  let targetDealerId: string | undefined = undefined;

  if (hasRole('dealer')) {
    // Try to get from localStorage (for dealer login) or fallback to user id
    try {
      const dealerInfoStr = localStorage.getItem('dealer_info');
      if (dealerInfoStr) {
        const dealerInfo = JSON.parse(dealerInfoStr);
        targetDealerId = dealerInfo.id;
      }
    } catch (e) {
      console.error('Error parsing dealer info:', e);
    }
    if (!targetDealerId) targetDealerId = user?.id;
  } else if (hasRole('dealer_staff')) {
    targetDealerId = user?.user_metadata?.dealer_id;
  } else if (hasRole('powerdesk') || hasRole('sales')) {
    targetDealerId = undefined; // Fetch all for powerdesk/sales (filtered by query probably)
  } else {
    targetDealerId = user?.id; // Fallback for regular users? unread-leads uses this hook?
  }

  const { data: enquiries, isLoading } = useDealerEnquiries(targetDealerId);

  const { data: leadIntelligence, isLoading: loadingLeadStats } = useLeadIntelligence();
  const leadStats = leadIntelligence?.stats;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      new: 'default',
      contacted: 'secondary',
      qualified: 'outline',
      negotiating: 'default',
      converted: 'default',
      lost: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getEnquiryTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'test_drive':
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }: any) => format(new Date(row.original.created_at), 'MMM dd, yyyy'),
    },
    {
      accessorKey: 'car_listing',
      header: 'Car',
      cell: ({ row }: any) => {
        const car = row.original.car_listing;
        return (
          <div className="flex items-center gap-2">
            <img
              src={car?.photos?.[0]?.thumbnail_url || '/placeholder.svg'}
              alt="Car"
              className="h-10 w-16 object-cover rounded"
            />
            <div>
              <p className="font-medium">
                {car?.brand?.name} {car?.model?.name} {car?.variant}
              </p>
              <p className="text-sm text-muted-foreground">{car?.year_of_make}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'user',
      header: 'Customer',
      cell: ({ row }: any) => {
        const user = row.original.user;
        const guest = row.original.guest_name;
        return (
          <div>
            <p className="font-medium">{user?.full_name || guest || 'Guest'}</p>
            <p className="text-sm text-muted-foreground">
              {user?.phone_number || row.original.guest_phone}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'enquiry_type',
      header: 'Type',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {getEnquiryTypeIcon(row.original.enquiry_type)}
          <span className="capitalize">{row.original.enquiry_type}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }: any) => (
        <Badge
          variant={
            row.original.priority === 'urgent'
              ? 'destructive'
              : row.original.priority === 'high'
                ? 'default'
                : 'outline'
          }
        >
          {row.original.priority}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedEnquiryId(row.original.id)}
        >
          View Details
        </Button>
      ),
    },
  ];

  const filteredEnquiries = statusFilter === 'all'
    ? enquiries
    : enquiries?.filter((e: any) => e.status === statusFilter);

  const renderMobileLead = (row: any) => {
    const lead = row.original;
    const car = lead.car_listing;
    const customer = lead.user;
    const guest = lead.guest_name;
    const customerName = customer?.full_name || guest || 'Guest';
    const customerPhone = customer?.phone_number || lead.guest_phone;

    return (
      <div className="bg-card border rounded-xl p-3 shadow-sm space-y-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex gap-3 flex-1 min-w-0">
            <img
              src={car?.photos?.[0]?.thumbnail_url || '/placeholder.svg'}
              alt="Car"
              className="h-16 w-16 rounded-md object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm truncate pr-2">
                  {car?.brand?.name} {car?.model?.name}
                </h4>
                {getStatusBadge(lead.status)}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {car?.variant} • {car?.year_of_make}
              </p>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal flex gap-1 items-center bg-muted/50">
                  {getEnquiryTypeIcon(lead.enquiry_type)}
                  <span className="capitalize">{lead.enquiry_type}</span>
                </Badge>
                {lead.priority !== 'normal' && (
                  <Badge
                    variant={lead.priority === 'urgent' ? 'destructive' : 'default'}
                    className="text-[10px] px-1.5 py-0 h-5"
                  >
                    {lead.priority}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 mt-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium leading-none">{customerName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{customerPhone}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-primary hover:text-primary/80 hover:bg-primary/5"
            onClick={() => setSelectedEnquiryId(lead.id)}
          >
            View Details
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground">Track and manage customer enquiries</p>
        </div>
      </div>

      <LeadStatsCards enquiries={enquiries} />

      {/* Lead Intelligence Section */}
      {leadStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Lead Intelligence</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <LeadScoringOverview stats={leadStats} />
            <div className="grid gap-6 md:grid-cols-2">
              <BuyingTimelineFunnel data={leadIntelligence?.timelineData || []} />
              <LeadQualityTrends />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-transparent border-0 shadow-none sm:bg-card sm:border sm:shadow-sm">
        <CardHeader className="px-0 sm:px-6">
          <CardTitle>All Leads</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="contacted">Contacted</TabsTrigger>
              <TabsTrigger value="qualified">Qualified</TabsTrigger>
              <TabsTrigger value="negotiating">Negotiation</TabsTrigger>
              <TabsTrigger value="converted">Converted</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="mt-0">
              <DataTable
                columns={columns}
                data={filteredEnquiries || []}
                renderMobileItem={renderMobileLead}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LeadDetailsDialog
        enquiryId={selectedEnquiryId}
        open={!!selectedEnquiryId}
        onOpenChange={(open) => !open && setSelectedEnquiryId(null)}
      />
    </div>
  );
}
