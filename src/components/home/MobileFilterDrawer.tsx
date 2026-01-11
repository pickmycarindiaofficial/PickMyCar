import { memo, useState, useCallback } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filters } from '@/types';

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
}

const FilterSection = memo(({ title, children, defaultOpen = true }: FilterSectionProps) => {
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
                    {children}
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

const brands = ['Maruti Suzuki', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Mahindra', 'Kia'];
const years = ['2023 & above', '2021 & above', '2019 & above', '2017 & above', '2015 & above'];
const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const bodyTypes = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Coupe'];
const transmissions = ['Automatic', 'Manual'];

export const MobileFilterDrawer = memo(({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClearAll,
    carCount,
}: MobileFilterDrawerProps) => {
    // Get active filter tags
    const getActiveTags = useCallback(() => {
        const tags: { label: string; key: keyof Filters; value: any }[] = [];

        if (filters.years.length > 0) {
            filters.years.forEach(year => {
                tags.push({ label: `${year} & above`, key: 'years', value: year });
            });
        }
        if (filters.transmissions.length > 0) {
            filters.transmissions.forEach(t => {
                tags.push({ label: t, key: 'transmissions', value: t });
            });
        }
        if (filters.brands.length > 0) {
            filters.brands.forEach(b => {
                tags.push({ label: b, key: 'brands', value: b });
            });
        }
        if (filters.fuelTypes.length > 0) {
            filters.fuelTypes.forEach(f => {
                tags.push({ label: f, key: 'fuelTypes', value: f });
            });
        }

        return tags;
    }, [filters]);

    const removeTag = useCallback((key: keyof Filters, value: any) => {
        const currentValue = filters[key] as any[];
        onFilterChange(key, currentValue.filter(v => v !== value));
    }, [filters, onFilterChange]);

    const toggleArrayFilter = useCallback((key: keyof Filters, value: any) => {
        const currentValue = filters[key] as any[];
        if (currentValue.includes(value)) {
            onFilterChange(key, currentValue.filter(v => v !== value));
        } else {
            onFilterChange(key, [...currentValue, value]);
        }
    }, [filters, onFilterChange]);

    if (!isOpen) return null;

    const activeTags = getActiveTags();

    return (
        <div className="fixed inset-0 z-50 bg-background md:hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-lg font-semibold">Filters</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClearAll}
                        className="text-primary font-medium text-sm"
                    >
                        Reset All
                    </button>
                    <button onClick={onClose} className="p-1">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Active Filter Tags */}
            {activeTags.length > 0 && (
                <div className="px-4 py-3 border-b border-border">
                    <div className="flex flex-wrap gap-2">
                        {activeTags.map((tag, idx) => (
                            <Badge
                                key={`${tag.key}-${idx}`}
                                variant="secondary"
                                className="px-3 py-1.5 text-sm cursor-pointer"
                                onClick={() => removeTag(tag.key, tag.value)}
                            >
                                {tag.label}
                                <X className="h-3 w-3 ml-1" />
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Filter Sections - Scrollable */}
            <div className="flex-1 overflow-y-auto pb-20">
                {/* Brand */}
                <FilterSection title="Brand" defaultOpen={true}>
                    <div className="grid grid-cols-2 gap-3">
                        {brands.map(brand => (
                            <label
                                key={brand}
                                className="flex items-center gap-3 cursor-pointer touch-manipulation"
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${filters.brands.includes(brand) ? 'border-primary bg-primary' : 'border-muted-foreground'
                                    }`}>
                                    {filters.brands.includes(brand) && (
                                        <div className="w-2 h-2 rounded-full bg-white" />
                                    )}
                                </div>
                                <span className="text-sm">{brand}</span>
                            </label>
                        ))}
                    </div>
                </FilterSection>

                {/* Year */}
                <FilterSection title="Year" defaultOpen={false}>
                    <div className="space-y-3">
                        {years.map(year => {
                            const yearValue = year.split(' ')[0];
                            return (
                                <label
                                    key={year}
                                    className="flex items-center gap-3 cursor-pointer touch-manipulation"
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${filters.years.includes(yearValue) ? 'border-primary bg-primary' : 'border-muted-foreground'
                                        }`}>
                                        {filters.years.includes(yearValue) && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className="text-sm">{year}</span>
                                </label>
                            );
                        })}
                    </div>
                </FilterSection>

                {/* Fuel Type */}
                <FilterSection title="Fuel Type" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {fuelTypes.map(fuel => (
                            <FilterChip
                                key={fuel}
                                label={fuel}
                                isActive={filters.fuelTypes.includes(fuel)}
                                onClick={() => toggleArrayFilter('fuelTypes', fuel)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Body Type */}
                <FilterSection title="Body Type" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {bodyTypes.map(type => (
                            <FilterChip
                                key={type}
                                label={type}
                                isActive={filters.bodyTypes.includes(type)}
                                onClick={() => toggleArrayFilter('bodyTypes', type)}
                            />
                        ))}
                    </div>
                </FilterSection>

                {/* Transmission */}
                <FilterSection title="Transmission" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2">
                        {transmissions.map(trans => (
                            <FilterChip
                                key={trans}
                                label={trans}
                                isActive={filters.transmissions.includes(trans)}
                                onClick={() => toggleArrayFilter('transmissions', trans)}
                            />
                        ))}
                    </div>
                </FilterSection>
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border md:hidden safe-area-bottom">
                <Button
                    onClick={onClose}
                    className="w-full h-12 text-base font-semibold rounded-full bg-primary"
                >
                    Show {carCount} Cars
                </Button>
            </div>
        </div>
    );
});

MobileFilterDrawer.displayName = 'MobileFilterDrawer';
