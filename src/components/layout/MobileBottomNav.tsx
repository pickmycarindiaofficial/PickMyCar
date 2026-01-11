import { memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Heart, User } from 'lucide-react';

interface MobileBottomNavProps {
    onSearchClick?: () => void;
}

// Individual nav item - memoized for performance
const NavItem = memo(({
    icon: Icon,
    label,
    isActive,
    onClick,
}: {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px] touch-manipulation transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
        aria-current={isActive ? 'page' : undefined}
    >
        <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] font-medium">{label}</span>
    </button>
));

NavItem.displayName = 'NavItem';

export const MobileBottomNav = memo(({ onSearchClick }: MobileBottomNavProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = useCallback((path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    }, [location.pathname]);

    const handleNavigate = useCallback((path: string) => {
        navigate(path);
    }, [navigate]);

    return (
        <nav
            className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border md:hidden safe-area-bottom"
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-stretch">
                <NavItem
                    icon={Home}
                    label="Home"
                    isActive={isActive('/')}
                    onClick={() => handleNavigate('/')}
                />
                <NavItem
                    icon={Search}
                    label="Search"
                    isActive={false}
                    onClick={() => onSearchClick?.()}
                />
                <NavItem
                    icon={Plus}
                    label="Sell Car"
                    isActive={isActive('/sell')}
                    onClick={() => handleNavigate('/sell-car')}
                />
                <NavItem
                    icon={Heart}
                    label="Saved"
                    isActive={isActive('/saved')}
                    onClick={() => handleNavigate('/saved-cars')}
                />
                <NavItem
                    icon={User}
                    label="Profile"
                    isActive={isActive('/profile')}
                    onClick={() => handleNavigate('/profile')}
                />
            </div>
        </nav>
    );
});

MobileBottomNav.displayName = 'MobileBottomNav';
