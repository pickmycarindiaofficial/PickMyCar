import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Car, Clock, CheckCircle, Eye, XCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/common/StatsCard';
import { PermissionGate } from '@/components/common/PermissionGate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CarListingForm } from '@/components/listing/CarListingForm';
import { CarListingsTable } from '@/components/listing/CarListingsTable';
import { CarListingsFilters } from '@/components/listing/CarListingsFilters';
import { CarEconomicProfileEditor } from '@/components/dealer/CarEconomicProfileEditor';
import { useCarListings, useCarListingStats } from '@/hooks/useCarListings';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/content/Pagination';
import { toast } from 'sonner';
import { safeLocalStorage } from '@/lib/utils';

export default function CarListings() {
  const [activeTab, setActiveTab] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<any | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ledgerListing, setLedgerListing] = useState<any | null>(null);
  const { roles, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  // Filter states
  const [sellerTypeFilter, setSellerTypeFilter] = useState<'all' | 'dealer' | 'individual'>('all');
  const [selectedDealerId, setSelectedDealerId] = useState<string>('all');
  const [selectedCityId, setSelectedCityId] = useState<string>('all');
  const [phoneSearch, setPhoneSearch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedTransmission, setSelectedTransmission] = useState<string>('all');
  const [selectedFuelType, setSelectedFuelType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const isPowerDesk = roles.includes('powerdesk');

  // Build dynamic filters including activeTab for status filtering
  const dynamicFilters = useMemo(() => {
    const filters: any = {
      page: currentPage,
      pageSize: 20,
    };

    // Add status filter based on active tab
    if (activeTab !== 'all') {
      const statusMap: Record<string, string> = {
        'pending': 'pending_verification',
        'verified': 'verified',
        'live': 'live',
        'rejected': 'rejected',
        'sold': 'sold',
      };
      filters.status = statusMap[activeTab];
    }

    // CRITICAL: For dealers, ALWAYS filter by their own user ID
    // CRITICAL: For dealers and staff, ALWAYS filter by their own dealer ID
    if (!isPowerDesk) {
      filters.seller_type = 'dealer';

      // Get dealer ID from metadata (for staff) or local storage (for dealer) or user ID fallback
      let currentDealerId = user?.user_metadata?.dealer_id; // Check staff metadata first

      if (!currentDealerId) {
        try {
          const dealerInfoStr = safeLocalStorage.getItem('dealer_info');
          if (dealerInfoStr) {
            const dealerInfo = JSON.parse(dealerInfoStr);
            currentDealerId = dealerInfo.id;
          }
        } catch (e) {
          console.error('Error parsing dealer info:', e);
        }
      }

      // Fallback to user ID if no dealer ID found (for direct dealer login)
      if (!currentDealerId) {
        currentDealerId = user?.id;
      }

      if (currentDealerId) {
        filters.seller_id = currentDealerId;
      }
    } else {
      // PowerDesk can filter by seller type
      if (sellerTypeFilter !== 'all') {
        filters.seller_type = sellerTypeFilter;
      }

      // PowerDesk can filter by specific dealer
      if (sellerTypeFilter === 'dealer' && selectedDealerId && selectedDealerId !== 'all') {
        filters.seller_id = selectedDealerId;
      }
    }

    // City filter
    if (selectedCityId && selectedCityId !== 'all') {
      filters.city_id = selectedCityId;
    }

    // Phone search
    if (phoneSearch.trim()) {
      filters.phone_number = phoneSearch.trim();
    }

    // New Filters
    if (searchQuery.trim()) filters.search_query = searchQuery.trim();
    if (selectedBrand && selectedBrand !== 'all') filters.brand_id = selectedBrand;
    if (selectedModel && selectedModel !== 'all') filters.model_id = selectedModel;
    if (selectedTransmission && selectedTransmission !== 'all') filters.transmission_id = selectedTransmission;
    if (selectedFuelType && selectedFuelType !== 'all') filters.fuel_type_id = selectedFuelType;

    return filters;
  }, [isPowerDesk, user?.id, sellerTypeFilter, selectedDealerId, selectedCityId, phoneSearch, searchQuery, selectedBrand, selectedModel, selectedTransmission, selectedFuelType, currentPage, activeTab]);

  // Build filters for stats (without pagination and status)
  const statsFilters = useMemo(() => {
    const filters: any = {};

    // CRITICAL: For dealers, ALWAYS filter by their own user ID
    // CRITICAL: For dealers, ALWAYS filter by their own user ID
    if (!isPowerDesk) {
      filters.seller_type = 'dealer';

      let currentDealerId = user?.user_metadata?.dealer_id; // Check staff metadata first

      if (!currentDealerId) {
        try {
          const dealerInfoStr = safeLocalStorage.getItem('dealer_info');
          if (dealerInfoStr) {
            const dealerInfo = JSON.parse(dealerInfoStr);
            currentDealerId = dealerInfo.id;
          }
        } catch (e) {
          console.error('Error parsing dealer info:', e);
        }
      }

      if (!currentDealerId) {
        currentDealerId = user?.id;
      }

      if (currentDealerId) {
        filters.seller_id = currentDealerId;
      }
    } else {
      if (sellerTypeFilter !== 'all') {
        filters.seller_type = sellerTypeFilter;
      }

      if (sellerTypeFilter === 'dealer' && selectedDealerId && selectedDealerId !== 'all') {
        filters.seller_id = selectedDealerId;
      }
    }

    if (selectedCityId && selectedCityId !== 'all') {
      filters.city_id = selectedCityId;
    }

    if (phoneSearch.trim()) {
      filters.phone_number = phoneSearch.trim();
    }

    // New Filters
    if (searchQuery.trim()) filters.search_query = searchQuery.trim();
    if (selectedBrand && selectedBrand !== 'all') filters.brand_id = selectedBrand;
    if (selectedModel && selectedModel !== 'all') filters.model_id = selectedModel;
    if (selectedTransmission && selectedTransmission !== 'all') filters.transmission_id = selectedTransmission;
    if (selectedFuelType && selectedFuelType !== 'all') filters.fuel_type_id = selectedFuelType;

    return filters;
  }, [isPowerDesk, user?.id, sellerTypeFilter, selectedDealerId, selectedCityId, phoneSearch, searchQuery, selectedBrand, selectedModel, selectedTransmission, selectedFuelType]);

  // Fetch listings with filters - wait for auth to load
  const { data: paginatedData, isLoading: queryLoading } = useCarListings(
    dynamicFilters,
    { enabled: !authLoading }
  );

  // Fetch stats separately (without pagination)
  const { data: statsData } = useCarListingStats(statsFilters);

  const isLoading = authLoading || queryLoading;
  const listings = paginatedData?.data || [];
  const totalCount = paginatedData?.count || 0;
  const totalPages = paginatedData?.totalPages || 1;

  // Use stats from separate query
  const stats = statsData || {
    total: 0,
    pending: 0,
    verified: 0,
    live: 0,
    rejected: 0,
    sold: 0,
  };


  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sellerTypeFilter, selectedDealerId, selectedCityId, phoneSearch, searchQuery, selectedBrand, selectedModel, selectedTransmission, selectedFuelType]);

  const handleClearFilters = () => {
    setSellerTypeFilter('all');
    setSelectedDealerId('all');
    setSelectedCityId('all');
    setPhoneSearch('');
    setSearchQuery('');
    setSelectedBrand('all');
    setSelectedModel('all');
    setSelectedTransmission('all');
    setSelectedFuelType('all');
    setActiveTab('all');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditListing = (listing: any) => {
    setEditingListing(listing);
    setEditDialogOpen(true);
  };

  const handleEditLedger = (listing: any) => {
    setLedgerListing(listing);
  };

  return (
    <PermissionGate roles={['powerdesk', 'dealer', 'dealer_staff']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isPowerDesk ? 'All Car Listings' : 'My Listings'}
            </h1>
            <p className="text-muted-foreground">
              {isPowerDesk
                ? 'Manage all car listings across the platform'
                : 'Manage your car listings and inventory'}
            </p>
          </div>
          <Dialog open={formOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Car Listing</DialogTitle>
              </DialogHeader>
              <CarListingForm onSuccess={() => setFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters - Now available for all */}
        <CarListingsFilters
          sellerType={sellerTypeFilter}
          onSellerTypeChange={(value) => {
            setSellerTypeFilter(value);
            setSelectedDealerId('all');
            setCurrentPage(1);
          }}
          selectedDealer={selectedDealerId}
          onDealerChange={(value) => {
            setSelectedDealerId(value);
            setCurrentPage(1);
          }}
          selectedCity={selectedCityId}
          onCityChange={(value) => {
            setSelectedCityId(value);
            setCurrentPage(1);
          }}
          phoneSearch={phoneSearch}
          onPhoneSearchChange={(value) => {
            setPhoneSearch(value);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchQueryChange={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          selectedBrand={selectedBrand}
          onBrandChange={(value) => {
            setSelectedBrand(value);
            setSelectedModel('all'); // Reset model when brand changes
            setCurrentPage(1);
          }}
          selectedModel={selectedModel}
          onModelChange={(value) => {
            setSelectedModel(value);
            setCurrentPage(1);
          }}
          selectedTransmission={selectedTransmission}
          onTransmissionChange={(value) => {
            setSelectedTransmission(value);
            setCurrentPage(1);
          }}
          selectedFuelType={selectedFuelType}
          onFuelTypeChange={(value) => {
            setSelectedFuelType(value);
            setCurrentPage(1);
          }}
          onClearAll={handleClearFilters}
          isPowerDesk={isPowerDesk}
        />

        {/* Stats */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Custom Mobile Simple Cards or Standard StatsCards with Responsive Classes */}
            {/* The user wants "simple in 4 box". Let's try responsive StatsCard first but it might be too much markup.
                Replacing with a conditional render or just custom styles for all breakpoints is tricky.
                Let's use the StatsCard but override styles via className for mobile density.
            */}
            <div className="contents md:hidden">
              {/* Mobile Specific Simple View */}
              <div className="bg-card border rounded-lg p-2 text-center shadow-sm">
                <div className="text-xl font-bold">{stats.total}</div>
                <div className="text-[10px] text-muted-foreground uppercase">Total</div>
              </div>
              <div className="bg-card border rounded-lg p-2 text-center shadow-sm">
                <div className="text-xl font-bold">{stats.pending}</div>
                <div className="text-[10px] text-muted-foreground uppercase text-yellow-600">Pending</div>
              </div>
              <div className="bg-card border rounded-lg p-2 text-center shadow-sm">
                <div className="text-xl font-bold">{stats.live}</div>
                <div className="text-[10px] text-muted-foreground uppercase text-green-600">Live</div>
              </div>
              <div className="bg-card border rounded-lg p-2 text-center shadow-sm">
                <div className="text-xl font-bold">{stats.sold}</div>
                <div className="text-[10px] text-muted-foreground uppercase text-gray-500">Sold</div>
              </div>
            </div>

            {/* Desktop Original StatsCards */}
            <div className="hidden md:contents">
              <StatsCard title="Total Listings" value={stats.total} icon={Car} />
              <StatsCard title="Pending Verification" value={stats.pending} icon={Clock} className="border-warning/20" />
              <StatsCard title="Live" value={stats.live} icon={Eye} className="border-success/20" />
              <StatsCard title="Sold" value={stats.sold} icon={DollarSign} className="border-primary/20" />
            </div>
          </div>
        )}
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto min-w-full justify-start p-1 md:w-full md:grid md:grid-cols-6">
              <TabsTrigger value="all" className="min-w-[100px] flex-1">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending" className="min-w-[100px] flex-1">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="verified" className="min-w-[100px] flex-1">Verified ({stats.verified})</TabsTrigger>
              <TabsTrigger value="live" className="min-w-[100px] flex-1">Live ({stats.live})</TabsTrigger>
              <TabsTrigger value="rejected" className="min-w-[100px] flex-1">Rejected ({stats.rejected})</TabsTrigger>
              <TabsTrigger value="sold" className="min-w-[100px] flex-1">Sold ({stats.sold})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : listings && listings.length > 0 ? (
              <>
                <CarListingsTable
                  data={listings}
                  onEdit={handleEditListing}
                  onEditLedger={handleEditLedger}
                  onViewDetails={(listing) => navigate(`/car/${listing.id}`)}
                />
                {totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <Card className="p-12 text-center">
                <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground mb-4">
                  {Object.keys(dynamicFilters).filter(k => k !== 'page' && k !== 'pageSize').length > 0
                    ? "Try adjusting your filters or search criteria"
                    : "Start by adding a new car listing"}
                </p>
                {Object.keys(dynamicFilters).filter(k => k !== 'page' && k !== 'pageSize').length > 0 && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          {['pending', 'verified', 'live', 'rejected', 'sold'].map((tab) => (
            <TabsContent key={`tab-${tab}-${activeTab}`} value={tab} className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : listings && listings.length > 0 ? (
                <>
                  <CarListingsTable
                    data={listings}
                    onEdit={handleEditListing}
                    onEditLedger={handleEditLedger}
                    onViewDetails={(listing) => navigate(`/car/${listing.id}`)}
                  />
                  {totalPages > 1 && (
                    <div className="mt-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <Car className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No {tab} listings</h3>
                  <p className="text-muted-foreground mb-4">
                    {Object.keys(dynamicFilters).filter(k => k !== 'page' && k !== 'pageSize' && k !== 'status').length > 0
                      ? "Try adjusting your filters"
                      : `No listings with ${tab} status at the moment`}
                  </p>
                  {Object.keys(dynamicFilters).filter(k => k !== 'page' && k !== 'pageSize' && k !== 'status').length > 0 && (
                    <Button onClick={handleClearFilters} variant="outline">
                      Clear All Filters
                    </Button>
                  )}
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Pagination Info */}
        {!isLoading && totalCount > 0 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)} to {Math.min(currentPage * 20, totalCount)} of {totalCount} total listings
            </p>
          </div>
        )}

        {/* Edit Listing Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Car Listing</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Make changes to the listing and click "Update Listing" to save
              </p>
            </DialogHeader>
            {editingListing && (
              <div className="text-sm p-4 bg-muted/50 border rounded-md space-y-1">
                <p className="font-medium">
                  Editing: <span className="text-primary">{editingListing.brands?.name} {editingListing.models?.name} {editingListing.variant}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Listing ID: {editingListing.listing_id} • Status: {editingListing.status}
                </p>
              </div>
            )}
            <CarListingForm
              listingId={editingListing?.id}
              mode="edit"
              onSuccess={() => {
                setEditDialogOpen(false);
                setEditingListing(null);
                toast.success('Changes saved successfully!');
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Profit Ledger Modal */}
        {ledgerListing && (
          <CarEconomicProfileEditor
            car={ledgerListing}
            isOpen={!!ledgerListing}
            onClose={() => setLedgerListing(null)}
          />
        )}
      </div>
    </PermissionGate>
  );
}
