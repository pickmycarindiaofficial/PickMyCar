import { memo, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Bell, MapPin, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCities } from '@/hooks/useCities';
import { useBodyTypes } from '@/hooks/useBodyTypes';
import logoImage from '@/assets/logo.png';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

// Quick filter configurations - these map to actual filter values
const quickFilters = [
    { id: 'all', label: 'All Cars', filterKey: null, filterValue: null },
    { id: 'under5l', label: 'Under ₹5L', filterKey: 'priceMax', filterValue: 500000 },
    { id: 'under10l', label: 'Under ₹10L', filterKey: 'priceMax', filterValue: 1000000 },
    { id: 'suv', label: 'SUV', filterKey: 'bodyTypes', filterValue: 'SUV' },
    { id: '7seater', label: '7 Seater', filterKey: 'seats', filterValue: '7' },
    { id: 'automatic', label: 'Automatic', filterKey: 'transmissions', filterValue: 'Automatic' },
];

interface MobileHomeHeaderProps {
    carCount: number;
    cityName: string;
    onSearch: (term: string) => void;
    onOpenFilters: () => void;
    onOpenSort: () => void;
    onCityChange: (city: string) => void;
    onQuickFilterChange: (filterKey: string, filterValue: any) => void;
    onClearFilters: () => void;
    activeFilters: {
        priceMax?: number;
        bodyTypes?: string[];
        seats?: string[];
        transmissions?: string[];
    };
}

export const MobileHomeHeader = memo(({
    carCount,
    cityName = 'All Cities',
    onSearch,
    onOpenFilters,
    onOpenSort,
    onCityChange,
    onQuickFilterChange,
    onClearFilters,
    activeFilters,
}: MobileHomeHeaderProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [citySheetOpen, setCitySheetOpen] = useState(false);

    // Load cities from database
    const { data: cities = [], isLoading: citiesLoading } = useCities();
    const activeCities = cities.filter((c: any) => c.is_active !== false);

    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchTerm.trim());
    }, [searchTerm, onSearch]);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        onSearch('');
    }, [onSearch]);

    const handleCitySelect = useCallback((city: string) => {
        onCityChange(city);
        setCitySheetOpen(false);
    }, [onCityChange]);

    const handleQuickFilter = useCallback((filter: typeof quickFilters[0]) => {
        if (filter.id === 'all') {
            onClearFilters();
        } else if (filter.filterKey && filter.filterValue) {
            onQuickFilterChange(filter.filterKey, filter.filterValue);
        }
    }, [onQuickFilterChange, onClearFilters]);

    // Check if a quick filter is active
    const isFilterActive = useCallback((filter: typeof quickFilters[0]) => {
        if (filter.id === 'all') {
            return !activeFilters.priceMax &&
                (!activeFilters.bodyTypes || activeFilters.bodyTypes.length === 0) &&
                (!activeFilters.seats || activeFilters.seats.length === 0) &&
                (!activeFilters.transmissions || activeFilters.transmissions.length === 0);
        }

        if (filter.filterKey === 'priceMax') {
            return activeFilters.priceMax === filter.filterValue;
        }
        if (filter.filterKey === 'bodyTypes') {
            return activeFilters.bodyTypes?.includes(filter.filterValue as string);
        }
        if (filter.filterKey === 'seats') {
            return activeFilters.seats?.includes(filter.filterValue as string);
        }
        if (filter.filterKey === 'transmissions') {
            return activeFilters.transmissions?.includes(filter.filterValue as string);
        }
        return false;
    }, [activeFilters]);

    return (
        <>
            {/* Sticky Header Container */}
            <div className="sticky top-0 z-40 bg-background md:hidden shadow-sm">
                {/* Top Bar - Logo, Location, Notifications */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                    <img src={logoImage} alt="PickMyCar" className="h-7" />

                    <div className="flex items-center gap-2">
                        {/* City Selector */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCitySheetOpen(true)}
                            className="h-8 px-3 rounded-full text-xs font-medium gap-1"
                        >
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="max-w-[80px] truncate">{cityName}</span>
                            <ChevronDown className="h-3 w-3" />
                        </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full" />
                        </Button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-2">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search cars, brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-10 h-10 rounded-full bg-muted/50 border-0 text-sm"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                </div>

                {/* Car Count + Sort/Filter Bar */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border/50">
                    <p className="text-sm">
                        <span className="font-bold text-foreground">{carCount} Cars</span>
                        <span className="text-muted-foreground ml-1">in {cityName}</span>
                    </p>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onOpenSort}
                            className="h-8 px-2.5 text-sm font-medium"
                        >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Sort
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onOpenFilters}
                            className="h-8 px-2.5 text-sm font-medium"
                        >
                            <SlidersHorizontal className="h-4 w-4 mr-1" />
                            Filters
                        </Button>
                    </div>
                </div>

                {/* Quick Filter Pills - Horizontally scrollable */}
                <div className="px-4 pb-2.5 overflow-x-auto hide-scrollbar">
                    <div className="flex gap-2 w-max">
                        {quickFilters.map((filter) => {
                            const isActive = isFilterActive(filter);

                            return (
                                <button
                                    key={filter.id}
                                    onClick={() => handleQuickFilter(filter)}
                                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all touch-manipulation ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-muted/80 text-foreground hover:bg-muted active:scale-95'
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* City Selection Sheet */}
            <Sheet open={citySheetOpen} onOpenChange={setCitySheetOpen}>
                <SheetContent side="bottom" className="h-[70vh] rounded-t-xl">
                    <SheetHeader>
                        <SheetTitle>Select City</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(70vh-80px)]">
                        <button
                            onClick={() => handleCitySelect('All Cities')}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${cityName === 'All Cities' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                                }`}
                        >
                            All Cities
                        </button>
                        {citiesLoading ? (
                            <div className="px-4 py-3 text-muted-foreground">Loading cities...</div>
                        ) : (
                            activeCities.map((city: any) => (
                                <button
                                    key={city.id}
                                    onClick={() => handleCitySelect(city.name)}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${cityName === city.name ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                                        }`}
                                >
                                    {city.name}
                                    {city.state && <span className="text-muted-foreground ml-1 text-sm">({city.state})</span>}
                                </button>
                            ))
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
});

MobileHomeHeader.displayName = 'MobileHomeHeader';
