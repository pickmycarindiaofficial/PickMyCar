import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FilterSection } from './FilterSection';
import { SegmentToggle } from './SegmentToggle';
import { CheckboxFilterGroup } from './CheckboxFilterGroup';
import { BrandModelFilter } from './BrandModelFilter';
import { PriceRangeFilter } from './PriceRangeFilter';
import { ColorFilter } from './ColorFilter';
import { Filters, CarSegment } from '@/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCities } from '@/hooks/useCities';
import { useBrands } from '@/hooks/useBrands';
import { useModels } from '@/hooks/useModels';
import { useCategories } from '@/hooks/useCategories';
import { useFuelTypes } from '@/hooks/useFuelTypes';
import { useBodyTypes } from '@/hooks/useBodyTypes';
import { useTransmissions } from '@/hooks/useTransmissions';
import { useFeatures } from '@/hooks/useFeatures';
import { useSeatOptions } from '@/hooks/useSeatOptions';
import { useOwnerTypes } from '@/hooks/useOwnerTypes';

interface SidebarProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onClose: () => void;
  allCount: number;
  premiumCount: number;
  onSegmentChange: (segment: CarSegment) => void;
}

export const Sidebar = ({ filters, onFilterChange, onClearAll, isOpen, onClose, allCount, premiumCount, onSegmentChange }: SidebarProps) => {
  // Fetch all master data
  const { data: cities = [] } = useCities();
  const { data: brands = [] } = useBrands();
  const { data: allModels = [] } = useModels();
  const { data: categories = [] } = useCategories();
  const { data: fuelTypes = [] } = useFuelTypes();
  const { data: bodyTypes = [] } = useBodyTypes();
  const { data: transmissions = [] } = useTransmissions();
  const { data: features = [] } = useFeatures();
  const { data: seatOptions = [] } = useSeatOptions();
  const { data: ownerTypes = [] } = useOwnerTypes();

  // Filter only active items
  const activeCities = cities.filter(c => c.is_active);
  const allActiveBrands = brands.filter(b => b.is_active);
  const activeCategories = categories.filter(c => c.is_active);
  const activeFuelTypes = fuelTypes.filter(f => f.is_active);
  const activeBodyTypes = bodyTypes.filter(b => b.is_active);
  const activeTransmissions = transmissions.filter(t => t.is_active);
  const activeFeatures = features.filter(f => f.is_active);
  const activeSeatOptions = seatOptions.filter(s => s.is_active);
  const activeOwnerTypes = ownerTypes.filter(o => o.is_active);

  // Segment-aware brand filtering
  const activeBrands = useMemo(() => {
    if (filters.segment === 'premium') {
      return allActiveBrands.filter(b => b.is_luxury);
    }
    return allActiveBrands;
  }, [allActiveBrands, filters.segment]);

  // Build dynamic models by brand
  const modelsByBrand = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    filters.brands.forEach(brandName => {
      const brand = activeBrands.find(b => b.name === brandName);
      if (brand) {
        const brandModels = allModels
          .filter(m => m.brand_id === brand.id && m.is_active)
          .map(m => m.name);
        mapping[brandName] = brandModels;
      }
    });
    return mapping;
  }, [activeBrands, allModels, filters.brands]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full bg-card transition-transform duration-300 lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:w-80 lg:translate-x-0 lg:border-r ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border p-4 lg:hidden">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filters Content */}
          <div className="flex-1 overflow-y-auto px-4">
            {/* Segment Toggle */}
            <div className="py-4 border-b border-border">
              <SegmentToggle
                segment={filters.segment}
                onSegmentChange={onSegmentChange}
                allCount={allCount}
                premiumCount={premiumCount}
              />
            </div>

            {/* City Select */}
            <FilterSection title="Select City">
              <select
                value={filters.city}
                onChange={(e) => onFilterChange({ city: e.target.value })}
                className="w-full rounded-md border border-[#2664eb] bg-[#2664eb] text-white px-3 py-2 text-sm focus:ring-2 focus:ring-[#2664eb]"
              >
                <option value="All Cities" className="bg-[#2664eb]">All Cities</option>
                {activeCities.map((city) => (
                  <option key={city.id} value={city.name} className="bg-[#2664eb]">
                    {city.name}
                  </option>
                ))}
              </select>
            </FilterSection>


            {/* Car Category */}
            <FilterSection title="Car Category">
              <CheckboxFilterGroup
                options={activeCategories.map(c => c.name)}
                selected={filters.categories}
                onChange={(categories) => onFilterChange({ categories })}
              />
            </FilterSection>

            {/* Brands & Models - Professional Accordion Style */}
            <FilterSection title="Brands + Models">
              <BrandModelFilter
                brands={activeBrands}
                allModels={allModels.filter(m => m.is_active)}
                selectedBrands={filters.brands}
                selectedModels={filters.models}
                onBrandsChange={(brands) => onFilterChange({ brands })}
                onModelsChange={(models) => onFilterChange({ models })}
              />
            </FilterSection>


            {/* Kms Driven */}
            <FilterSection title="Kms Driven">
              <RadioGroup value={filters.kmsDriven} onValueChange={(value) => onFilterChange({ kmsDriven: value })}>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="any" id="kms-any" />
                    <Label htmlFor="kms-any" className="text-sm cursor-pointer">Any</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="0-20000" id="kms-20k" />
                    <Label htmlFor="kms-20k" className="text-sm cursor-pointer">Under 20,000 km</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="20000-50000" id="kms-50k" />
                    <Label htmlFor="kms-50k" className="text-sm cursor-pointer">20,000 to 50,000 km</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="50000-80000" id="kms-80k" />
                    <Label htmlFor="kms-80k" className="text-sm cursor-pointer">50,000 to 80,000 km</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="80000+" id="kms-above" />
                    <Label htmlFor="kms-above" className="text-sm cursor-pointer">Above 80,000 km</Label>
                  </div>
                </div>
              </RadioGroup>
            </FilterSection>

            {/* Fuel Type */}
            <FilterSection title="Fuel Type">
              <CheckboxFilterGroup
                options={activeFuelTypes.map(f => f.name)}
                selected={filters.fuelTypes}
                onChange={(fuelTypes) => onFilterChange({ fuelTypes })}
              />
            </FilterSection>

            {/* Body Type */}
            <FilterSection title="Body Type">
              <CheckboxFilterGroup
                options={activeBodyTypes.map(b => b.name)}
                selected={filters.bodyTypes}
                onChange={(bodyTypes) => onFilterChange({ bodyTypes })}
              />
            </FilterSection>

            {/* Transmission */}
            <FilterSection title="Transmission">
              <CheckboxFilterGroup
                options={activeTransmissions.map(t => t.name)}
                selected={filters.transmissions}
                onChange={(transmissions) => onFilterChange({ transmissions })}
              />
            </FilterSection>

            {/* Features */}
            <FilterSection title="Features" defaultOpen={false}>
              <CheckboxFilterGroup
                options={activeFeatures.map(f => f.name)}
                selected={filters.features}
                onChange={(features) => onFilterChange({ features })}
              />
            </FilterSection>

            {/* Seats */}
            <FilterSection title="Seats" defaultOpen={false}>
              <CheckboxFilterGroup
                options={activeSeatOptions.map(s => `${s.seats} Seater`)}
                selected={filters.seats}
                onChange={(seats) => onFilterChange({ seats })}
              />
            </FilterSection>

            {/* Owner */}
            <FilterSection title="Owner" defaultOpen={false}>
              <CheckboxFilterGroup
                options={activeOwnerTypes.map(o => o.name)}
                selected={filters.owners}
                onChange={(owners) => onFilterChange({ owners })}
              />
            </FilterSection>

            {/* Color */}
            <FilterSection title="Color" defaultOpen={false}>
              <ColorFilter
                selected={filters.colors}
                onChange={(colors) => onFilterChange({ colors })}
              />
            </FilterSection>

            {/* Availability */}
            <FilterSection title="Availability" defaultOpen={false}>
              <CheckboxFilterGroup
                options={['In Stock', 'Booked', 'Sold']}
                selected={filters.availability}
                onChange={(availability) => onFilterChange({ availability })}
              />
            </FilterSection>
          </div>

          {/* Footer Actions (Mobile) */}
          <div className="border-t border-border p-4 lg:hidden">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClearAll} className="flex-1">
                Clear All
              </Button>
              <Button onClick={onClose} className="flex-1">
                Show Results
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
