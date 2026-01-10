import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Calendar } from 'lucide-react';
import { useBrands } from '@/hooks/useBrands';

export interface MarketFiltersState {
  days: number;
  brand: string;
}

interface MarketFiltersProps {
  filters: MarketFiltersState;
  onFilterChange: (filters: MarketFiltersState) => void;
}

export function MarketFilters({ filters, onFilterChange }: MarketFiltersProps) {
  const { data: brands } = useBrands();

  const handleReset = () => {
    onFilterChange({ days: 7, brand: '' });
  };

  const hasActiveFilters = filters.days !== 7 || filters.brand !== '';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Time Range Filter */}
      <Select
        value={filters.days.toString()}
        onValueChange={(value) => onFilterChange({ ...filters, days: parseInt(value) })}
      >
        <SelectTrigger className="w-[180px]">
          <Calendar className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Last 7 days</SelectItem>
          <SelectItem value="14">Last 14 days</SelectItem>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="60">Last 60 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
        </SelectContent>
      </Select>

      {/* Brand Filter */}
      <Select
        value={filters.brand || 'all'}
        onValueChange={(value) => onFilterChange({ ...filters, brand: value === 'all' ? '' : value })}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {brands?.map((brand) => (
            <SelectItem key={brand.id} value={brand.name}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-10 px-3"
        >
          <X className="h-4 w-4 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
}
