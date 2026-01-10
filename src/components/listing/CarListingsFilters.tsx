import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useCities } from '@/hooks/useCities';
import { useDealers } from '@/hooks/useDealers';
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
  onClearAll,
  isPowerDesk,
}: CarListingsFiltersProps) {
  const { data: cities, isLoading: citiesLoading } = useCities();
  const { data: dealers, isLoading: dealersLoading } = useDealers();

  const activeCities = cities?.filter(c => c.is_active) || [];
  const hasActiveFilters = sellerType !== 'all' || selectedDealer || selectedCity || phoneSearch;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="ml-auto h-7 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seller Type Filter - Only for PowerDesk */}
        {isPowerDesk && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Seller Type</label>
            <Select value={sellerType} onValueChange={onSellerTypeChange}>
              <SelectTrigger className="h-9 bg-[#2664eb] text-white border-[#2664eb]">
                <SelectValue placeholder="All sellers" />
              </SelectTrigger>
              <SelectContent className="bg-[#2664eb] text-white border-[#2664eb]">
                <SelectItem value="all" className="focus:bg-[#3b7aff] focus:text-white">All Sellers</SelectItem>
                <SelectItem value="dealer" className="focus:bg-[#3b7aff] focus:text-white">Dealers</SelectItem>
                <SelectItem value="individual" className="focus:bg-[#3b7aff] focus:text-white">Individuals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Dealer Filter - Conditional */}
        {(sellerType === 'dealer' || !isPowerDesk) && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Dealer</label>
            {dealersLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={selectedDealer} onValueChange={onDealerChange}>
                <SelectTrigger className="h-9 bg-[#2664eb] text-white border-[#2664eb]">
                  <SelectValue placeholder="All dealers" />
                </SelectTrigger>
                <SelectContent className="bg-[#2664eb] text-white border-[#2664eb]">
                  <SelectItem value="all" className="focus:bg-[#3b7aff] focus:text-white">All Dealers</SelectItem>
                  {dealers?.map((dealer) => (
                    <SelectItem key={dealer.id} value={dealer.id} className="focus:bg-[#3b7aff] focus:text-white">
                      {dealer.full_name} (@{dealer.username})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">City</label>
          {citiesLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select value={selectedCity} onValueChange={onCityChange}>
              <SelectTrigger className="h-9 bg-[#2664eb] text-white border-[#2664eb]">
                <SelectValue placeholder="All cities" />
              </SelectTrigger>
              <SelectContent className="bg-[#2664eb] text-white border-[#2664eb]">
                <SelectItem value="all" className="focus:bg-[#3b7aff] focus:text-white">All Cities</SelectItem>
                {activeCities.map((city) => (
                  <SelectItem key={city.id} value={city.id} className="focus:bg-[#3b7aff] focus:text-white">
                    {city.name}{city.state ? `, ${city.state}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Phone Search */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by phone..."
              value={phoneSearch}
              onChange={(e) => onPhoneSearchChange(e.target.value)}
              className="h-9 pl-8"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
