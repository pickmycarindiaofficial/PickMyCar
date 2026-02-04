import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { NotificationBell } from '@/components/communication/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function DashboardLayout() {
  const { profile, signOut, roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const primaryRole = roles[0] || 'user';
  const isDealer = primaryRole === 'dealer';
  const isFullScreenRoute = location.pathname === '/dashboard/users';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <div
        className="min-h-screen flex w-full"
        style={isDealer ? {
          backgroundColor: 'hsl(var(--dealer-bg))'
        } : {
          backgroundColor: 'hsl(var(--background))'
        }}
      >
        {!isFullScreenRoute && <DashboardSidebar />}

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header
            className="sticky top-0 z-40 flex h-16 items-center gap-4 px-6"
            style={isDealer ? {
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              borderBottom: 'none',
            } : {
              backgroundColor: 'hsl(var(--background) / 0.95)',
              borderBottom: '1px solid hsl(var(--border))'
            }}
          >
            <SidebarTrigger />

            <div className="flex-1" />

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{profile?.username}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/')}>
                  <span>Back to Website</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Main Content */}
          <main className={`flex-1 ${isFullScreenRoute ? '' : 'overflow-y-auto p-6'}`}>
            {isFullScreenRoute ? (
              <Outlet />
            ) : (
              <div className="max-w-7xl mx-auto w-full">
                <Outlet />
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
