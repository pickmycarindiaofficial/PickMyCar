
import { Home, Car, Users, MessageSquare, User, Building2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { roles } = useAuth();

    // Only show for dealers (and maybe powerdesk/sales depending on requirement, but user asked for "dealer dashboard")
    // User request: "do the dealer dashboard is completely mobile responsive exactly like mobile app"
    const isDealer = roles.includes('dealer');

    if (!isDealer) return null;

    const navItems = [
        {
            label: 'Home',
            icon: Home,
            path: '/dashboard/home',
            activeColor: 'text-blue-600',
        },
        {
            label: 'Stock',
            icon: Car,
            path: '/dashboard/inventory', // Or my-listings depending on what "Stock" usually refers to. Inventory seems appropriate.
            activeColor: 'text-orange-500',
        },
        {
            label: 'Leads',
            icon: Users,
            path: '/dashboard/leads',
            activeColor: 'text-purple-600',
        },
        {
            label: 'Chat',
            icon: MessageSquare,
            path: '/dashboard/messages',
            activeColor: 'text-green-600',
        },
        {
            label: 'Profile',
            icon: Building2,
            path: '/dashboard/dealer-profile-info',
            activeColor: 'text-indigo-600',
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-2 pb-safe md:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive ? item.activeColor : "text-gray-500"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "h-6 w-6 transition-all duration-200",
                                    isActive ? "scale-110" : "scale-100"
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={cn(
                                "text-[10px] font-medium transition-all duration-200",
                                isActive ? "font-bold" : "font-medium"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
