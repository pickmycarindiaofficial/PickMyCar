import { memo, useState, useCallback } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filters } from '@/types';
import { useBrands } from '@/hooks/useBrands';
import { useModels } from '@/hooks/useModels';
import { useBodyTypes } from '@/hooks/useBodyTypes';
import { useFuelTypes } from '@/hooks/useFuelTypes';
import { useYears, useTransmissions } from '@/hooks/useTypes';
import { useCities } from '@/hooks/useCities';
import { useCategories } from '@/hooks/useCategories';
import { useSeatOptions } from '@/hooks/useSeatOptions';
import { useOwnerTypes } from '@/hooks/useOwnerTypes';

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onFilterChange: (key: keyof Filters, value: any) => void;
    onClearAll: () => void;
    carCount: number;
}

interface FilterSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    isLoading?: boolean;
}

const FilterSection = memo(({ title, children, defaultOpen = true, isLoading = false }: FilterSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-4 py-4 text-left"
            >
                <span className="font-medium text-base">{title}</span>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
            </button>
            {isOpen && (
                <div className="px-4 pb-4">
                    {isLoading ? (
                        <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 w-20 bg-muted animate-pulse rounded-full" />
                            ))}
                        </div>
                    ) : (
                        children
                    )}
                </div>
            )}
        </div>
    );
});

FilterSection.displayName = 'FilterSection';

const FilterChip = memo(({
    label,
    isActive,
    onClick
}: {
    label: string;
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors touch-manipulation border ${isActive
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background text-foreground border-border hover:border-primary/50'
            }`}
    >
        {label}
    </button>
));

FilterChip.displayName = 'FilterChip';

// KMs Driven options
const kmsOptions = [
    { value: 'any', label: 'Any' },
    { value: '0-20000', label: 'Under 20,000 km' },
    { value: '20000-50000', label: '20,000 - 50,000 km' },
    { value: '50000-80000', label: '50,000 - 80,000 km' },
    { value: '80000-+', label: 'Above 80,000 km' },
];

export const MobileFilterDrawer = memo(({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClearAll,
    carCount,
}: MobileFilterDrawerProps) => {
    // Fetch all filter data from database
    const { data: brands = [], isLoading: brandsLoading } = useBrands();
    const { data: allModels = [], isLoading: modelsLoading } = useModels();
    const { data: bodyTypes = [], isLoading: bodyTypesLoading } = useBodyTypes();
    const { data: fuelTypes = [], isLoading: fuelTypesLoading } = useFuelTypes();
    const { data: years = [], isLoading: yearsLoading } = useYears();
    const { data: transmissions = [], isLoading: transmissionsLoading } = useTransmissions();
    const { data: cities = [], isLoading: citiesLoading } = useCities();
    const { data: categories = [], isLoading: categoriesLoading } = useCategories();
    const { data: seatOptions = [], isLoading: seatsLoading } = useSeatOptions();
    const { data: ownerTypes = [], isLoading: ownersLoading } = useOwnerTypes();

    const toggleArrayFilter = useCallback((key: keyof Filters, value: any) => {
        const currentValue = filters[key] as any[];
        if (currentValue.includes(value)) {
            onFilterChange(key, currentValue.filter(v => v !== value));
        } else {
            onFilterChange(key, [...currentValue, value]);
        }
    }, [filters, onFilterChange]);

    // Get active models for a specific brand
    const getModelsForBrand = useCallback((brandId: string) => {
        return allModels.filter(m => m.brand_id === brandId && m.is_active);
    }, [allModels]);

    // Toggle brand and auto-clear its models when deselected
    const toggleBrandWithModels = useCallback((brandName: string, brandId: string) => {
        const currentBrands = filters.brands;
        if (currentBrands.includes(brandName)) {
            // Deselecting brand — also remove its models
            const brandModelNames = getModelsForBrand(brandId).map(m => m.name);
            onFilterChange('brands', currentBrands.filter(b => b !== brandName));
            const currentModels = filters.models || [];
            if (currentModels.length > 0) {
                onFilterChange('models', currentModels.filter(m => !brandModelNames.includes(m)));
            }
        } else {
            // Selecting brand
            onFilterChange('brands', [...currentBrands, brandName]);
        }
    }, [filters.brands, filters.models, getModelsForBrand, onFilterChange]);

    if (!isOpen) return null;

    // Filter only active items
    const activeBrands = brands.filter((b: any) => b.is_active !== false);
    const activeBodyTypes = bodyTypes.filter((b: any) => b.is_active !== false);
    const activeFuelTypes = fuelTypes.filter((f: any) => f.is_active !== false);
    const activeYears = years.filter((y: any) => y.is_active !== false);
    const activeTransmissions = transmissions.filter((t: any) => t.is_active !== false);
    const activeCities = cities.filter((c: any) => c.is_active !== false);
    const activeCategories = categories.filter((c: any) => c.is_active !== false);
    const activeSeatOptions = seatOptions.filter((s: any) => s.is_active !== false);
    const activeOwnerTypes = ownerTypes.filter((o: any) => o.is_active !== false);

    return (
        <div className="fixed inset-0 z-[100] bg-background lg:hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-lg font-semibold">Filters</h2>
                <div className="flex items-center gap-4">
                    <button onClick={onClearAll} className="text-primary font-medium text-sm">
                        Reset All
                    </button>
                    <button onClick={onClose} className="p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Filter Sections - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-4">
                {/* City */}
                <FilterSection title="City" defaultOpen={false} isLoading={citiesLoading}>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip
                            label="All Cities"
                            isActive={filters.city === 'All Cities'}
                            onClick={() => onFilterChange('city', 'All Cities')}
                        />
                        {activeCities.map((city: any) => (
                            <FilterChip
                                key={city.id}
                                label={city.name}
                                isActive={filters.city === city.name}
                                onClick={() => onFilterChange('city', city.name)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Brand + Model */}
                <FilterSection title="Brand & Model" defaultOpen={true} isLoading={brandsLoading}>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                        {activeBrands.map((brand: any) => {
                            const isBrandSelected = filters.brands.includes(brand.name);
                            const brandModels = getModelsForBrand(brand.id);
                            const selectedModelCount = isBrandSelected
                                ? (filters.models || []).filter(m => brandModels.some(bm => bm.name === m)).length
                                : 0;

                            return (
                                <div key={brand.id}>
                                    {/* Brand row */}
                                    <label className="flex items-center gap-3 cursor-pointer touch-manipulation py-2">
                                        <input
                                            type="checkbox"
                                            checked={isBrandSelected}
                                            onChange={() => toggleBrandWithModels(brand.name, brand.id)}
                                            className="w-4 h-4 accent-primary"
                                        />
                                        <span className={`text-sm font-medium ${isBrandSelected ? 'text-primary' : ''}`}>
                                            {brand.name}
                                        </span>
                                        {selectedModelCount > 0 && (
                                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                                                {selectedModelCount}
                                            </span>
                                        )}
                                    </label>

                                    {/* Nested models — shown when brand is selected */}
                                    {isBrandSelected && brandModels.length > 0 && (
                                        <div className="ml-7 pl-3 pb-2 border-l-2 border-primary/30 space-y-1">
                                            {modelsLoading ? (
                                                <div className="flex gap-2 flex-wrap">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="h-8 w-16 bg-muted animate-pulse rounded-full" />
                                                    ))}
                                                </div>
                                            ) : (
                                                brandModels.map((model: any) => {
                                                    const isModelSelected = (filters.models || []).includes(model.name);
                                                    return (
                                                        <label
                                                            key={model.id}
                                                            className="flex items-center gap-3 cursor-pointer touch-manipulation py-1.5"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isModelSelected}
                                                                onChange={() => toggleArrayFilter('models', model.name)}
                                                                className="w-3.5 h-3.5 accent-primary"
                                                            />
                                                            <span className={`text-sm ${isModelSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                                                                {model.name}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Category */}
                <FilterSection title="Category" defaultOpen={false} isLoading={categoriesLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeCategories.map((cat: any) => (
                            <FilterChip
                                key={cat.id}
                                label={cat.name}
                                isActive={filters.categories.includes(cat.name)}
                                onClick={() => toggleArrayFilter('categories', cat.name)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Year */}
                <FilterSection title="Year" defaultOpen={false} isLoading={yearsLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeYears.slice(0, 8).map((year: any) => (
                            <FilterChip
                                key={year.id}
                                label={String(year.year)}
                                isActive={filters.years.includes(String(year.year))}
                                onClick={() => toggleArrayFilter('years', String(year.year))}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Fuel Type */}
                <FilterSection title="Fuel Type" defaultOpen={false} isLoading={fuelTypesLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeFuelTypes.map((fuel: any) => (
                            <FilterChip
                                key={fuel.id}
                                label={fuel.name}
                                isActive={filters.fuelTypes.includes(fuel.name)}
                                onClick={() => toggleArrayFilter('fuelTypes', fuel.name)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Body Type */}
                <FilterSection title="Body Type" defaultOpen={false} isLoading={bodyTypesLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeBodyTypes.map((type: any) => (
                            <FilterChip
                                key={type.id}
                                label={type.name}
                                isActive={filters.bodyTypes.includes(type.name)}
                                onClick={() => toggleArrayFilter('bodyTypes', type.name)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Transmission */}
                <FilterSection title="Transmission" defaultOpen={false} isLoading={transmissionsLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeTransmissions.map((trans: any) => (
                            <FilterChip
                                key={trans.id}
                                label={trans.name}
                                isActive={filters.transmissions.includes(trans.name)}
                                onClick={() => toggleArrayFilter('transmissions', trans.name)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* KMs Driven */}
                <FilterSection title="Kms Driven" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {kmsOptions.map((option) => (
                            <FilterChip
                                key={option.value}
                                label={option.label}
                                isActive={filters.kmsDriven === option.value}
                                onClick={() => onFilterChange('kmsDriven', option.value)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Seats */}
                <FilterSection title="Seats" defaultOpen={false} isLoading={seatsLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeSeatOptions.map((seat: any) => (
                            <FilterChip
                                key={seat.id}
                                label={`${seat.seats} Seater`}
                                isActive={filters.seats.includes(String(seat.seats))}
                                onClick={() => toggleArrayFilter('seats', String(seat.seats))}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Owner Type */}
                <FilterSection title="Owner" defaultOpen={false} isLoading={ownersLoading}>
                    <div className="flex flex-wrap gap-2">
                        {activeOwnerTypes.map((owner: any) => (
                            <FilterChip
                                key={owner.id}
                                label={owner.name}
                                isActive={filters.owners.includes(owner.name)}
                                onClick={() => toggleArrayFilter('owners', owner.name)}
                            />
                        ))}
                    </div>
                </FilterSection>
            </div>

            {/* Bottom Buttons - Reset All + Apply */}
            <div className="flex-shrink-0 p-4 bg-background border-t border-border">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClearAll}
                        className="flex-1 h-12 text-base font-semibold rounded-full"
                    >
                        Reset All
                    </Button>
                    <Button
                        onClick={onClose}
                        className="flex-1 h-12 text-base font-semibold rounded-full bg-primary"
                    >
                        Apply ({carCount})
                    </Button>
                </div>
            </div>
        </div>
    );
});

MobileFilterDrawer.displayName = 'MobileFilterDrawer';
