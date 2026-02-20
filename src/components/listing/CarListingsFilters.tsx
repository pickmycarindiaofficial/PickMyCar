import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useCities } from '@/hooks/useCities';
import { useDealers } from '@/hooks/useDealers';
import { useBrands } from '@/hooks/useBrands';
import { useModels } from '@/hooks/useModels';
import { useFuelTypes } from '@/hooks/useFuelTypes';
import { useTransmissions } from '@/hooks/useTransmissions';
import { Skeleton } from '@/components/ui/skeleton';

interface CarListingsFiltersProps {
  sellerType: 'all' | 'dealer' | 'individual';
  onSellerTypeChange: (value: 'all' | 'dealer' | 'individual') => void;
  selectedDealer: string;
  onDealerChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (value: string) => void;
  phoneSearch: string;
  onPhoneSearchChange: (value: string) => void;

  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  selectedBrand: string;
  onBrandChange: (value: string) => void;
  selectedModel: string;
  onModelChange: (value: string) => void;
  selectedTransmission: string;
  onTransmissionChange: (value: string) => void;
  selectedFuelType: string;
  onFuelTypeChange: (value: string) => void;

  onClearAll: () => void;
  isPowerDesk: boolean;
}

export function CarListingsFilters({
  sellerType,
  onSellerTypeChange,
  selectedDealer,
  onDealerChange,
  selectedCity,
  onCityChange,
  phoneSearch,
  onPhoneSearchChange,
  searchQuery,
  onSearchQueryChange,
  selectedBrand,
  onBrandChange,
  selectedModel,
  onModelChange,
  selectedTransmission,
  onTransmissionChange,
  selectedFuelType,
  onFuelTypeChange,
  onClearAll,
  isPowerDesk,
}: CarListingsFiltersProps) {
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: dealers, isLoading: dealersLoading } = useDealers();
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: models, isLoading: modelsLoading } = useModels();
  const { data: fuelTypes, isLoading: fuelLoading } = useFuelTypes();
  const { data: transmissions, isLoading: transLoading } = useTransmissions();

  const activeCities = cities?.filter(c => c.is_active) || [];
  const filteredModels = selectedBrand && selectedBrand !== 'all'
    ? models?.filter(m => m.brand_id === selectedBrand)
    : models;

  const hasActiveFilters = sellerType !== 'all' ||
    selectedDealer !== 'all' && selectedDealer !== '' ||
    selectedCity !== 'all' && selectedCity !== '' ||
    phoneSearch !== '' ||
    searchQuery !== '' ||
    selectedBrand !== 'all' && selectedBrand !== '' ||
    selectedModel !== 'all' && selectedModel !== '' ||
    selectedTransmission !== 'all' && selectedTransmission !== '' ||
    selectedFuelType !== 'all' && selectedFuelType !== '';

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Find Listings</h3>
        </div>

        {/* Main Search Bar */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search car name, variant, or registration number..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="h-9 pl-8"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-9 px-3 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Brand Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Brand</label>
          <Select value={selectedBrand} onValueChange={onBrandChange}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands?.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Model</label>
          <Select value={selectedModel} onValueChange={onModelChange} disabled={selectedBrand === 'all' || !selectedBrand}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {filteredModels?.map(model => (
                <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Fuel Type</label>
          <Select value={selectedFuelType} onValueChange={onFuelTypeChange}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="All Fuel Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {fuelTypes?.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Transmission */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Transmission</label>
          <Select value={selectedTransmission} onValueChange={onTransmissionChange}>
            <SelectTrigger className="h-9 bg-background">
              <SelectValue placeholder="All Transmissions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {transmissions?.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">City</label>
          {citiesLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {activeCities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}{city.state ? `, ${city.state}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* PowerDesk Overrides */}
        {isPowerDesk && (
          <div className="space-y-2 lg:col-span-2 xl:col-span-1">
            <label className="text-xs font-medium text-muted-foreground">Seller Type & Dealer</label>
            <div className="flex gap-2">
              <Select value={sellerType} onValueChange={onSellerTypeChange}>
                <SelectTrigger className="h-9 w-1/3 min-w-[100px] bg-background">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  <SelectItem value="dealer">Dealers</SelectItem>
                  <SelectItem value="individual">Individuals</SelectItem>
                </SelectContent>
              </Select>

              {(sellerType === 'dealer' || sellerType === 'all') && (
                <Select value={selectedDealer} onValueChange={onDealerChange}>
                  <SelectTrigger className="h-9 flex-1 bg-background">
                    <SelectValue placeholder="All dealers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dealers</SelectItem>
                    {dealers?.map((dealer) => (
                      <SelectItem key={dealer.id} value={dealer.id}>
                        {dealer.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
