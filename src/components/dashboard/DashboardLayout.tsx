import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { NotificationBell } from '@/components/communication/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, UserCircle } from 'lucide-react';
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
      <div className="flex h-svh w-full bg-background overflow-hidden">
        <DashboardSidebar />
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          <header className="flex h-14 items-center gap-4 border-b bg-background px-6 shadow-sm shrink-0">
            <SidebarTrigger className="md:hidden" />

            <div className="flex flex-1 items-center justify-between">
              {/* Breadcrumb or Title */}
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground truncate">
                  {isFullScreenRoute ? 'User Intelligence' : 'Dashboard'}
                </h1>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-muted-foreground"
                  onClick={() => navigate('/dashboard/dealer-profile-info')}
                >
                  <UserCircle className="h-5 w-5" />
                </Button>
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
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className={`flex-1 ${isFullScreenRoute ? '' : 'overflow-y-auto p-4 md:p-6 pb-24 md:pb-6'}`}>
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
      <MobileBottomNav />
    </SidebarProvider>
  );
}
