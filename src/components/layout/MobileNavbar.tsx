import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Bell, ChevronDown, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCities } from '@/hooks/useCities';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import logoImage from '@/assets/logo.png';

interface MobileNavbarProps {
    cityName?: string;
    onCityChange?: (city: string) => void;
    onBack?: () => void;
    showBackButton?: boolean;
    title?: string;
}

export const MobileNavbar = memo(({
    cityName = 'All Cities',
    onCityChange,
    onBack,
    showBackButton = false,
    title,
}: MobileNavbarProps) => {
    const [citySheetOpen, setCitySheetOpen] = useState(false);
    const navigate = useNavigate();

    // Load cities from database
    const { data: cities = [], isLoading: citiesLoading } = useCities();
    const activeCities = cities.filter((c: any) => c.is_active !== false);

    const handleCitySelect = useCallback((city: string) => {
        if (onCityChange) {
            onCityChange(city);
        }
        setCitySheetOpen(false);
    }, [onCityChange]);

    return (
        <>
            <header className="bg-card border-b border-border md:hidden safe-area-top">
                <div className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                        {showBackButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onBack}
                                className="h-8 w-8 -ml-2 touch-manipulation"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <button onClick={() => navigate('/')} className="touch-manipulation">
                            <img src={logoImage} alt="PickMyCar" className="h-12 w-auto" />
                        </button>
                    </div>

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

                {title && !showBackButton && (
                    <div className="px-4 pb-2">
                        <h1 className="text-sm font-semibold truncate text-center text-muted-foreground">
                            {title}
                        </h1>
                    </div>
                )}
            </header>

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

MobileNavbar.displayName = 'MobileNavbar';
