import { memo, useState, useCallback, useMemo } from 'react';
import { X, ChevronDown, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filters, CarSegment } from '@/types';

interface MobileFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: Filters;
    onFilterChange: (filters: Partial<Filters>) => void;
    onClearAll: () => void;
    activeFiltersCount: number;
}

// Memoized quick filter pill for performance
const QuickFilterPill = memo(({
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
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
    >
        {label}
    </button>
));

QuickFilterPill.displayName = 'QuickFilterPill';

// Main component - using memo for performance
export const MobileFilterSheet = memo(({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onClearAll,
    activeFiltersCount,
}: MobileFilterSheetProps) => {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);

    // Memoized handlers for performance
    const handleToggleSection = useCallback((section: string) => {
        setExpandedSection(prev => prev === section ? null : section);
    }, []);

    const handleApply = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleClear = useCallback(() => {
        onClearAll();
    }, [onClearAll]);

    // Quick filter options - memoized
    const quickFilters = useMemo(() => [
        { key: 'petrol', label: 'Petrol', filter: { fuelTypes: ['Petrol'] } },
        { key: 'diesel', label: 'Diesel', filter: { fuelTypes: ['Diesel'] } },
        { key: 'automatic', label: 'Automatic', filter: { transmissions: ['Automatic'] } },
        { key: 'under50k', label: 'Under 50K km', filter: { kmsDriven: '0-50000' as const } },
    ], []);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop - optimized with will-change */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm will-change-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Bottom Sheet Container */}
            <div
                className="fixed inset-x-0 bottom-0 z-50 will-change-transform animate-in slide-in-from-bottom duration-300"
                role="dialog"
                aria-modal="true"
                aria-label="Filters"
            >
                <div className="bg-card rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col safe-area-bottom">
                    {/* Drag Handle */}
                    <div className="flex justify-center py-3">
                        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">Filters</h2>
                            {activeFiltersCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="touch-manipulation">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Quick Filters - Horizontal Scroll */}
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {quickFilters.map((qf) => (
                                <QuickFilterPill
                                    key={qf.key}
                                    label={qf.label}
                                    isActive={
                                        (qf.filter.fuelTypes && filters.fuelTypes.includes(qf.filter.fuelTypes[0])) ||
                                        (qf.filter.transmissions && filters.transmissions.includes(qf.filter.transmissions[0])) ||
                                        (qf.filter.kmsDriven && filters.kmsDriven === qf.filter.kmsDriven)
                                    }
                                    onClick={() => {
                                        if (qf.filter.fuelTypes) {
                                            const isActive = filters.fuelTypes.includes(qf.filter.fuelTypes[0]);
                                            onFilterChange({
                                                fuelTypes: isActive
                                                    ? filters.fuelTypes.filter(f => f !== qf.filter.fuelTypes![0])
                                                    : [...filters.fuelTypes, qf.filter.fuelTypes[0]]
                                            });
                                        } else if (qf.filter.transmissions) {
                                            const isActive = filters.transmissions.includes(qf.filter.transmissions[0]);
                                            onFilterChange({
                                                transmissions: isActive
                                                    ? filters.transmissions.filter(t => t !== qf.filter.transmissions![0])
                                                    : [...filters.transmissions, qf.filter.transmissions[0]]
                                            });
                                        } else if (qf.filter.kmsDriven) {
                                            onFilterChange({
                                                kmsDriven: filters.kmsDriven === qf.filter.kmsDriven ? 'any' : qf.filter.kmsDriven
                                            });
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Filter Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2">
                        {/* Brand Filter */}
                        <FilterAccordion
                            title="Brand"
                            isExpanded={expandedSection === 'brand'}
                            onToggle={() => handleToggleSection('brand')}
                            count={filters.brands.length}
                        >
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                {['Maruti', 'Hyundai', 'Tata', 'Honda', 'Toyota', 'Mahindra'].map((brand) => (
                                    <button
                                        key={brand}
                                        onClick={() => {
                                            const isActive = filters.brands.includes(brand);
                                            onFilterChange({
                                                brands: isActive
                                                    ? filters.brands.filter(b => b !== brand)
                                                    : [...filters.brands, brand]
                                            });
                                        }}
                                        className={`p-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${filters.brands.includes(brand)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground'
                                            }`}
                                    >
                                        {brand}
                                    </button>
                                ))}
                            </div>
                        </FilterAccordion>

                        {/* Year Filter */}
                        <FilterAccordion
                            title="Year"
                            isExpanded={expandedSection === 'year'}
                            onToggle={() => handleToggleSection('year')}
                            count={filters.years.length}
                        >
                            <div className="grid grid-cols-4 gap-2 pt-2">
                                {['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017'].map((year) => (
                                    <button
                                        key={year}
                                        onClick={() => {
                                            const isActive = filters.years.includes(year);
                                            onFilterChange({
                                                years: isActive
                                                    ? filters.years.filter(y => y !== year)
                                                    : [...filters.years, year]
                                            });
                                        }}
                                        className={`p-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${filters.years.includes(year)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground'
                                            }`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </FilterAccordion>

                        {/* Fuel Type */}
                        <FilterAccordion
                            title="Fuel Type"
                            isExpanded={expandedSection === 'fuel'}
                            onToggle={() => handleToggleSection('fuel')}
                            count={filters.fuelTypes.length}
                        >
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                {['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((fuel) => (
                                    <button
                                        key={fuel}
                                        onClick={() => {
                                            const isActive = filters.fuelTypes.includes(fuel);
                                            onFilterChange({
                                                fuelTypes: isActive
                                                    ? filters.fuelTypes.filter(f => f !== fuel)
                                                    : [...filters.fuelTypes, fuel]
                                            });
                                        }}
                                        className={`p-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${filters.fuelTypes.includes(fuel)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground'
                                            }`}
                                    >
                                        {fuel}
                                    </button>
                                ))}
                            </div>
                        </FilterAccordion>

                        {/* Transmission */}
                        <FilterAccordion
                            title="Transmission"
                            isExpanded={expandedSection === 'transmission'}
                            onToggle={() => handleToggleSection('transmission')}
                            count={filters.transmissions.length}
                        >
                            <div className="grid grid-cols-2 gap-2 pt-2">
                                {['Manual', 'Automatic'].map((trans) => (
                                    <button
                                        key={trans}
                                        onClick={() => {
                                            const isActive = filters.transmissions.includes(trans);
                                            onFilterChange({
                                                transmissions: isActive
                                                    ? filters.transmissions.filter(t => t !== trans)
                                                    : [...filters.transmissions, trans]
                                            });
                                        }}
                                        className={`p-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${filters.transmissions.includes(trans)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground'
                                            }`}
                                    >
                                        {trans}
                                    </button>
                                ))}
                            </div>
                        </FilterAccordion>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-border p-4 flex gap-3 safe-area-bottom">
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            className="flex-1 h-12 text-base touch-manipulation"
                            disabled={activeFiltersCount === 0}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            onClick={handleApply}
                            className="flex-1 h-12 text-base touch-manipulation bg-gradient-to-r from-[#236ceb] to-[#4b8cf5]"
                        >
                            Show Results
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
});

MobileFilterSheet.displayName = 'MobileFilterSheet';

// Memoized accordion component
const FilterAccordion = memo(({
    title,
    isExpanded,
    onToggle,
    count,
    children,
}: {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    count: number;
    children: React.ReactNode;
}) => (
    <div className="border-b border-border py-3">
        <button
            onClick={onToggle}
            className="flex items-center justify-between w-full touch-manipulation"
        >
            <div className="flex items-center gap-2">
                <span className="font-medium">{title}</span>
                {count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {count}
                    </Badge>
                )}
            </div>
            <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''
                    }`}
            />
        </button>
        {isExpanded && children}
    </div>
));

FilterAccordion.displayName = 'FilterAccordion';
