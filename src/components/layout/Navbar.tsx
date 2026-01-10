import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, User, LogOut, LayoutDashboard, Car, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import logoImage from '@/assets/logo.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface NavbarProps {
  onSearch: (term: string) => void;
  onNavigate: (view: string) => void;
  onAuthAction?: (action: 'login' | 'dealer-login' | 'register-dealer') => void;
}

export const Navbar = ({ onSearch, onNavigate }: NavbarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile, signOut, roles } = useAuth();
  const navigate = useNavigate();

  const isStaffUser = roles.some(role => 
    ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection'].includes(role)
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto max-w-[1400px] px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img 
              src={logoImage} 
              alt="PickMyCar" 
              className="h-24 w-auto"
            />
          </button>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => onNavigate('buy')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Buy Car
            </button>
            <button
              onClick={() => onNavigate('sell')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              Sell Car
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by make, model, variant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('shortlisted')}
              className="hidden sm:flex"
            >
              <Heart className="h-5 w-5" />
            </Button>

            {!user ? (
              <>
                <Button onClick={() => navigate('/auth')} size="sm">
                  Login / Sign Up
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Hi, {profile?.full_name?.split(' ')[0] || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  {isStaffUser ? (
                    <>
                      {/* Staff Users Dropdown */}
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      {/* Customer Users Dropdown */}
                      <DropdownMenuItem onClick={() => navigate('/saved-cars')}>
                        <Heart className="mr-2 h-4 w-4" />
                        Shortlisted Cars
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/my-car-status')}>
                        <Car className="mr-2 h-4 w-4" />
                        My Car Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/recommended-cars')}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Recommended Cars
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut().then(() => navigate('/'))}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
