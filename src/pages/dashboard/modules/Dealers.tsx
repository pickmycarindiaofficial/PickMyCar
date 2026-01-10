import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, CheckCircle, XCircle, Building2, FileText, Phone, Mail, MapPin, Plus } from 'lucide-react';
import { useAllDealerApplications, useApproveApplication, useRejectApplication, useApplicationDetails } from '@/hooks/useDealerApplications';
import { useDealers } from '@/hooks/useDealers';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useConversations } from '@/hooks/useConversations';
import { DealerApplication } from '@/types/dealer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { getDealerDocumentUrl } from '@/lib/dealerDocuments';
import { DealerStatsCards } from '@/components/dealers/DealerStatsCards';
import { ActiveDealersTable } from '@/components/dealers/ActiveDealersTable';
import { CreateDealerDialog } from '@/components/dealers/CreateDealerDialog';
import { DealerProfileDialog } from '@/components/dealers/DealerProfileDialog';
import { EditDealerDialog } from '@/components/dealers/EditDealerDialog';
import { DealerListingsDialog } from '@/components/dealers/DealerListingsDialog';
import { SuspendDealerDialog } from '@/components/dealers/SuspendDealerDialog';
import { DealerBehaviorCards } from '@/components/dealers/DealerBehaviorCards';
import { ResponseTimeChart } from '@/components/dealers/ResponseTimeChart';
import { DealerLeaderboard } from '@/components/dealers/DealerLeaderboard';
import { useDealerBehaviorMetrics } from '@/hooks/useDealerBehaviorMetrics';
import { ArrowUpRight } from 'lucide-react';

export default function Dealers() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
  const [editDealerDialogOpen, setEditDealerDialogOpen] = useState(false);
  const [viewListingsDialogOpen, setViewListingsDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: pendingApplications, isLoading: loadingPending } = useAllDealerApplications('pending');
  const { data: approvedApplications, isLoading: loadingApproved } = useAllDealerApplications('approved');
  const { data: rejectedApplications, isLoading: loadingRejected } = useAllDealerApplications('rejected');
  const { data: dealers } = useDealers();
  const { data: plans } = useSubscriptionPlans();
  const { data: selectedApplication } = useApplicationDetails(selectedApplicationId);
  const { mutate: approveApplication, isPending: isApproving } = useApproveApplication();
  const { mutate: rejectApplication, isPending: isRejecting } = useRejectApplication();
  const { createConversation } = useConversations();
  const { data: behaviorData } = useDealerBehaviorMetrics();
  const dealerMetrics = behaviorData?.metrics;
  const leaderboard = behaviorData?.leaderboard;

  const columns = [
    {
      accessorKey: 'dealership_name',
      header: 'Dealership',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.dealership_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'owner_name',
      header: 'Owner',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phone_number',
      header: 'Phone',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.phone_number}</span>
        </div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.city?.name || row.original.state}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedApplicationId(row.original.id);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedApplicationId(row.original.id);
                  setApprovalDialogOpen(true);
                }}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedApplicationId(row.original.id);
                  setRejectionDialogOpen(true);
                }}
              >
                <XCircle className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const handleApprove = () => {
    if (!selectedApplicationId || !selectedPlanId) {
      toast({
        title: 'Missing information',
        description: 'Please select a subscription plan',
        variant: 'destructive',
      });
      return;
    }

    approveApplication(
      {
        applicationId: selectedApplicationId,
        planId: selectedPlanId,
        adminNotes,
      },
      {
        onSuccess: () => {
          setApprovalDialogOpen(false);
          setSelectedApplicationId(null);
          setSelectedPlanId('');
          setAdminNotes('');
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedApplicationId || !rejectionReason) {
      toast({
        title: 'Missing information',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    rejectApplication(
      {
        applicationId: selectedApplicationId,
        reason: rejectionReason,
      },
      {
        onSuccess: () => {
          setRejectionDialogOpen(false);
          setSelectedApplicationId(null);
          setRejectionReason('');
        },
      }
    );
  };

  const filteredData = (data: DealerApplication[] | undefined) => {
    if (!data) return [];
    if (!searchQuery) return data;

    return data.filter(
      (app) =>
        app.dealership_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phone_number.includes(searchQuery)
    );
  };

  const handleViewProfile = (dealerId: string) => {
    setSelectedDealerId(dealerId);
    setViewProfileDialogOpen(true);
  };

  const handleEditDetails = (dealerId: string) => {
    setSelectedDealerId(dealerId);
    setEditDealerDialogOpen(true);
  };

  const handleViewListings = (dealerId: string) => {
    setSelectedDealerId(dealerId);
    setViewListingsDialogOpen(true);
  };

  const handleSendMessage = async (dealerId: string) => {
    try {
      const conversationId = await createConversation([dealerId], 'direct');
      if (conversationId) {
        navigate('/dashboard/messages');
        toast({
          title: 'Success',
          description: 'Conversation opened',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
    }
  };

  const handleSuspendAccount = (dealerId: string) => {
    setSelectedDealerId(dealerId);
    setSuspendDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dealer Management</h1>
          <p className="text-muted-foreground">Manage dealer applications and accounts</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Dealer
        </Button>
      </div>

      <DealerStatsCards
        totalDealers={dealers?.length || 0}
        pendingApplications={pendingApplications?.length || 0}
        activePlans={dealers?.length || 0}
        thisMonth={0}
      />

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="relative">
            Pending Applications
            {pendingApplications && pendingApplications.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">
            Active Dealers ({dealers?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">Rejected Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Review</CardTitle>
              <CardDescription>Applications waiting for your approval</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPending ? (
                <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredData(pendingApplications)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {/* Dealer Performance Section */}
          {Array.isArray(dealerMetrics) && dealerMetrics.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Dealer Performance Overview</CardTitle>
                    <CardDescription>Real-time behavior analytics and quality metrics</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/dealer-analytics')}>
                    View Full Analytics
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <DealerBehaviorCards metrics={dealerMetrics[0]} />
                <div className="grid gap-6 md:grid-cols-2">
                  <ResponseTimeChart />
                  <DealerLeaderboard dealers={leaderboard?.slice(0, 5) || []} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Active Dealers</CardTitle>
              <CardDescription>All active dealer accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {!dealers ? (
                <div className="text-center py-8 text-muted-foreground">Loading dealers...</div>
              ) : (
                <ActiveDealersTable
                  dealers={dealers} 
                  onViewProfile={handleViewProfile}
                  onEditDetails={handleEditDetails}
                  onViewListings={handleViewListings}
                  onSendMessage={handleSendMessage}
                  onSuspendAccount={handleSuspendAccount}
                  onEditProfileInfo={(dealerId) => navigate(`/dashboard/dealer-profile-info/${dealerId}`)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Applications</CardTitle>
              <CardDescription>Applications that were not approved</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRejected ? (
                <div className="text-center py-8 text-muted-foreground">Loading rejected applications...</div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredData(rejectedApplications)}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApplicationId && !approvalDialogOpen && !rejectionDialogOpen} onOpenChange={() => setSelectedApplicationId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review complete dealer application information
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Business Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Dealership Name</p>
                    <p className="font-medium">{selectedApplication.dealership_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Business Type</p>
                    <p className="font-medium">{selectedApplication.business_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">GST Number</p>
                    <p className="font-medium">{selectedApplication.gst_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PAN Number</p>
                    <p className="font-medium">{selectedApplication.pan_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Owner Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Owner Name</p>
                    <p className="font-medium">{selectedApplication.owner_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aadhar Number</p>
                    <p className="font-medium">{selectedApplication.owner_aadhar_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{selectedApplication.phone_number}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedApplication.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">State</p>
                    <p className="font-medium">{selectedApplication.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pincode</p>
                    <p className="font-medium">{selectedApplication.pincode}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Documents</h3>
                <div className="space-y-2">
                  {selectedApplication.gst_certificate_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">GST Certificate</span>
                    </div>
                  )}
                  {selectedApplication.shop_registration_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Shop Registration</span>
                    </div>
                  )}
                  {selectedApplication.pan_card_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">PAN Card</span>
                    </div>
                  )}
                  {selectedApplication.owner_aadhar_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">Owner Aadhar</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedApplication.status === 'rejected' && selectedApplication.rejection_reason && (
                <div className="bg-destructive/10 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-destructive">Rejection Reason</h3>
                  <p>{selectedApplication.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Dealer Application</DialogTitle>
            <DialogDescription>
              Select a subscription plan and approve this dealer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subscription Plan *</label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.display_name} - ₹{plan.price}/{plan.billing_period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Any notes for this approval..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={isApproving || !selectedPlanId}>
                {isApproving ? 'Approving...' : 'Approve & Create Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this application
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !rejectionReason}
              >
                {isRejecting ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </div>
          </div>
          </DialogContent>
      </Dialog>

      {/* Create Dealer Dialog */}
      <CreateDealerDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <DealerProfileDialog
        open={viewProfileDialogOpen}
        onOpenChange={setViewProfileDialogOpen}
        dealerId={selectedDealerId}
        onEdit={() => {
          setViewProfileDialogOpen(false);
          handleEditDetails(selectedDealerId!);
        }}
      />

      <EditDealerDialog
        open={editDealerDialogOpen}
        onOpenChange={setEditDealerDialogOpen}
        dealerId={selectedDealerId}
      />

      <DealerListingsDialog
        open={viewListingsDialogOpen}
        onOpenChange={setViewListingsDialogOpen}
        dealerId={selectedDealerId}
      />

      <SuspendDealerDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        dealerId={selectedDealerId}
      />
    </div>
  );
}
