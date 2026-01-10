import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDealerListingsWithFilters, FilterOptions } from '@/hooks/useDealerListingsWithFilters';
import { CarCard } from '@/components/content/CarCard';
import { Car } from '@/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter, ArrowUpDown } from 'lucide-react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useSavedCars, useAddSavedCar, useRemoveSavedCar } from '@/hooks/useSavedCars';
import { toast } from 'sonner';
import { ShareDialog } from '@/components/common/ShareDialog';

interface DealerInventoryGridProps {
  dealerId: string;
}

export function DealerInventoryGrid({ dealerId }: DealerInventoryGridProps) {
  const navigate = useNavigate();
  const { requireAuth } = useAuthGuard();
  const { data: savedCars } = useSavedCars();
  const addSavedCar = useAddSavedCar();
  const removeSavedCar = useRemoveSavedCar();
  const [filterOpen, setFilterOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [carToShare, setCarToShare] = useState<Car | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'recent',
    brands: [],
  });

  const { data: listings, isLoading } = useDealerListingsWithFilters(dealerId, filters);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Get saved car IDs
  const savedCarIds = (savedCars || []).map((item: any) => item.car_listing_id);

  // Transform listing data to Car interface
  const transformedCars: Car[] = (listings || []).map((listing: any) => ({
    id: listing.id,
    title: `${listing.brand_name || ''} ${listing.model_name || ''} ${listing.variant || ''}`.trim(),
    year: listing.year_of_make,
    brand: listing.brand_name || '',
    model: listing.model_name || '',
    variant: listing.variant || '',
    price: Number(listing.expected_price),
    imageUrl: typeof listing.photos?.[0] === 'string' ? listing.photos[0] : listing.photos?.[0]?.url || '/placeholder.svg',
    kmsDriven: listing.kms_driven || 0,
    fuelType: listing.fuel_type || 'Petrol',
    transmission: listing.transmission || 'Manual',
    owner: listing.owner_type || '1st Owner',
    location: listing.city_name || '',
    city: listing.city_name || '',
    bodyType: listing.body_type || '',
    category: listing.category || 'Non Warranty',
    features: [],
    seats: listing.seats || 5,
    color: listing.color || '',
    availability: 'In Stock',
    isFeatured: listing.is_featured,
    dealerId: dealerId,
    sellerId: dealerId,
    multipleImageUrls: listing.photos || [],
    reasonsToBuy: listing.highlights || [],
  }));

  // Extract unique brands for filter
  const uniqueBrands = Array.from(
    new Set(listings?.map((listing: any) => listing.brand_name).filter(Boolean))
  ) as string[];

  // Count active filters
  const activeFilterCount = (filters.brands?.length || 0);

  // Handlers for car actions
  const handleCallDealer = (car: Car) => {
    requireAuth(() => {
      toast.success('Opening phone dialer...');
      // In real implementation, would fetch dealer phone from API
    }, { message: 'Please login to call dealer' });
  };

  const handleChat = (car: Car) => {
    requireAuth(() => {
      navigate(`/dashboard/messages?carId=${car.id}`);
    }, { message: 'Please login to chat with dealer' });
  };

  const handleToggleShortlist = (carId: string) => {
    requireAuth(() => {
      const isCurrentlySaved = savedCarIds.includes(carId);
      if (isCurrentlySaved) {
        removeSavedCar.mutate(carId);
      } else {
        addSavedCar.mutate(carId);
      }
    }, { message: 'Please login to save cars' });
  };

  const handleCardClick = (car: Car) => {
    navigate(`/car/${car.id}`);
  };

  const handleShare = (car: Car) => {
    setCarToShare(car);
    setShareDialogOpen(true);
  };

  // Filter Panel Component
  const FilterPanel = ({
    filters,
    onFilterChange,
    uniqueBrands,
    onClearFilters,
  }: {
    filters: FilterOptions;
    onFilterChange: (key: string, value: any) => void;
    uniqueBrands: string[];
    onClearFilters: () => void;
  }) => (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Brand</Label>
        <Select 
          value={filters.brands?.[0] || 'all'} 
          onValueChange={(value) => onFilterChange('brands', value === 'all' ? [] : [value])}
        >
          <SelectTrigger className="bg-[#2664eb] text-white border-[#2664eb]">
            <SelectValue placeholder="All Brands" />
          </SelectTrigger>
          <SelectContent className="bg-[#2664eb] text-white border-[#2664eb]">
            <SelectItem value="all" className="focus:bg-[#3b7aff] focus:text-white">All Brands</SelectItem>
            {uniqueBrands.map(brand => (
              <SelectItem key={brand} value={brand} className="focus:bg-[#3b7aff] focus:text-white">{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onClearFilters}
        >
          Clear
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() => setFilterOpen(false)}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ShareDialog 
        car={carToShare} 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen}
        source="dealer"
      />
      
      {/* Header with Sort and Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold">
          Available Cars ({listings?.length || 0})
        </h2>
        
        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <Select
            value={filters.sortBy || 'recent'}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="year_desc">Year: New to Old</SelectItem>
              <SelectItem value="year_asc">Year: Old to New</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-4" 
              align="end"
              sideOffset={8}
            >
              <FilterPanel
                filters={filters}
                onFilterChange={handleFilterChange}
                uniqueBrands={uniqueBrands}
                onClearFilters={() => {
                  setFilters({ sortBy: 'recent', brands: [] });
                  setFilterOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Car Listings Grid */}
      {transformedCars && transformedCars.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onCallDealer={handleCallDealer}
              onChat={handleChat}
              onToggleShortlist={handleToggleShortlist}
              isShortlisted={savedCarIds.includes(car.id)}
              onCardClick={handleCardClick}
              onShare={handleShare}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No cars available matching your filters.</p>
          <Button 
            variant="link" 
            onClick={() => {
              setFilters({ sortBy: 'recent', brands: [] });
              setFilterOpen(false);
            }}
            className="mt-2"
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}