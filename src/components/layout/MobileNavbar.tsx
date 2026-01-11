import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logoImage from '@/assets/logo.png';

interface MobileNavbarProps {
    onSearch: (term: string) => void;
    onBack?: () => void;
    showBackButton?: boolean;
    title?: string;
}

export const MobileNavbar = memo(({
    onSearch,
    onBack,
    showBackButton = false,
    title,
}: MobileNavbarProps) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearchSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            onSearch(searchTerm.trim());
            setIsSearchOpen(false);
        }
    }, [searchTerm, onSearch]);

    const handleCloseSearch = useCallback(() => {
        setIsSearchOpen(false);
        setSearchTerm('');
    }, []);

    // Full-screen search overlay
    if (isSearchOpen) {
        return (
            <div className="fixed inset-0 z-50 bg-background md:hidden">
                <div className="flex items-center gap-2 p-3 border-b border-border">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCloseSearch}
                        className="touch-manipulation"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <form onSubmit={handleSearchSubmit} className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                autoFocus
                                type="text"
                                placeholder="Search cars by make, model..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-11 text-base"
                            />
                        </div>
                    </form>
                    {searchTerm && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchTerm('')}
                            className="touch-manipulation"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Recent Searches / Suggestions could go here */}
                <div className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">Popular Searches</p>
                    <div className="flex flex-wrap gap-2">
                        {['Maruti Swift', 'Hyundai i20', 'Honda City', 'Tata Nexon'].map((term) => (
                            <button
                                key={term}
                                onClick={() => {
                                    setSearchTerm(term);
                                    onSearch(term);
                                    setIsSearchOpen(false);
                                }}
                                className="px-3 py-2 bg-secondary rounded-full text-sm font-medium touch-manipulation"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <header className="sticky top-0 z-40 bg-card border-b border-border md:hidden safe-area-top">
            <div className="flex items-center justify-between h-14 px-3">
                {showBackButton ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="touch-manipulation"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                ) : (
                    <button onClick={() => navigate('/')} className="touch-manipulation">
                        <img src={logoImage} alt="PickMyCar" className="h-10 w-auto" />
                    </button>
                )}

                {title && (
                    <h1 className="text-base font-semibold truncate flex-1 text-center">
                        {title}
                    </h1>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(true)}
                    className="touch-manipulation"
                    aria-label="Search"
                >
                    <Search className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
});

MobileNavbar.displayName = 'MobileNavbar';
