import { memo, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, Bell, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import logoImage from '@/assets/logo.png';

interface QuickFilter {
    id: string;
    label: string;
    isActive: boolean;
}

interface MobileHomeHeaderProps {
    carCount: number;
    cityName?: string;
    onSearch: (term: string) => void;
    onOpenFilters: () => void;
    onOpenSort: () => void;
    onQuickFilter: (filterId: string) => void;
    activeQuickFilters: string[];
}

const quickFilters: Omit<QuickFilter, 'isActive'>[] = [
    { id: 'all', label: 'All Cars' },
    { id: 'under5l', label: 'Under ₹5L' },
    { id: 'under10l', label: 'Under ₹10L' },
    { id: 'suv', label: 'SUV' },
    { id: 'automatic', label: 'Automatic' },
    { id: 'petrol', label: 'Petrol' },
    { id: 'diesel', label: 'Diesel' },
];

export const MobileHomeHeader = memo(({
    carCount,
    cityName = 'All Cities',
    onSearch,
    onOpenFilters,
    onOpenSort,
    onQuickFilter,
    activeQuickFilters,
}: MobileHomeHeaderProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            onSearch(searchTerm.trim());
        }
    }, [searchTerm, onSearch]);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
        onSearch('');
    }, [onSearch]);

    return (
        <div className="bg-background border-b border-border md:hidden">
            {/* Top Bar - Logo, Location, Notifications */}
            <div className="flex items-center justify-between px-4 py-3">
                <img src={logoImage} alt="PickMyCar" className="h-8" />

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 rounded-full text-xs font-medium"
                    >
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {cityName}
                    </Button>

                    <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background" />
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-3">
                <form onSubmit={handleSearchSubmit} className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search cars, brands..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="pl-10 pr-10 h-11 rounded-full bg-muted/50 border-0 text-sm"
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
            <div className="flex items-center justify-between px-4 py-2 border-t border-border">
                <p className="text-sm font-medium">
                    <span className="font-bold">{carCount} Cars</span>
                    <span className="text-muted-foreground ml-1">in {cityName}</span>
                </p>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenSort}
                        className="h-8 px-3 text-sm font-medium"
                    >
                        <ArrowUpDown className="h-4 w-4 mr-1" />
                        Sort
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onOpenFilters}
                        className="h-8 px-3 text-sm font-medium"
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-1" />
                        Filters
                    </Button>
                </div>
            </div>

            {/* Quick Filter Pills */}
            <div className="px-4 pb-3 overflow-x-auto hide-scrollbar">
                <div className="flex gap-2 w-max">
                    {quickFilters.map((filter) => {
                        const isActive = filter.id === 'all'
                            ? activeQuickFilters.length === 0
                            : activeQuickFilters.includes(filter.id);

                        return (
                            <button
                                key={filter.id}
                                onClick={() => onQuickFilter(filter.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-manipulation ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground hover:bg-muted/80'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

MobileHomeHeader.displayName = 'MobileHomeHeader';
