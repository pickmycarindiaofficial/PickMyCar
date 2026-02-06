import {
  Settings, Users, LayoutDashboard, Activity, Lock, MessageSquare,
  FileText, Globe, Database, Tag, BarChart3, Car, UserCircle,
  ClipboardList, TrendingUp, DollarSign, Calculator, FolderOpen,
  CheckCircle, FileCheck, Heart, Send, Package, Wrench, Building2, Store, Printer, TrendingDown,
  Brain, Lightbulb, LineChart, Target, Gauge, Sparkles, User, CalendarClock, Image, Shield
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import logoImage from '@/assets/logo.png';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/auth';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { usePendingApplicationsCount } from '@/hooks/usePendingApplicationsCount';
import { DealerProfileSection } from './DealerProfileSection';

interface NavItem {
  title: string;
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  roles: AppRole[];
  badge?: number | string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  powerdesk: 'hsl(var(--role-powerdesk))',
  website_manager: 'hsl(var(--role-website))',
  dealer: 'hsl(var(--role-dealer))',
  sales: 'hsl(var(--role-sales))',
  finance: 'hsl(var(--role-finance))',
  inspection: 'hsl(var(--role-inspection))',
  user: 'hsl(var(--role-user))',
  dealer_staff: 'hsl(var(--role-sales))',
};

// Icon colors for dealer dashboard
const ICON_COLORS: Record<string, string> = {
  '/dashboard/home': 'hsl(var(--dealer-accent-green))',
  '/dashboard/messages': 'hsl(var(--dealer-accent-pink))',
  '/dashboard/my-listings': 'hsl(var(--dealer-accent-cyan))',
  '/dashboard/inventory': 'hsl(var(--dealer-accent-orange))',
  '/dashboard/leads': 'hsl(var(--dealer-accent-purple))',
  '/dashboard/sales-pipeline': 'hsl(var(--dealer-accent-blue))',
  '/dashboard/finance-requests': 'hsl(var(--dealer-accent-green))',
  '/dashboard/inspections': 'hsl(var(--dealer-accent-yellow))',
};

const navigationItems: NavItem[] = [
  // Common Routes (All Roles)
  { title: 'Home', url: '/dashboard/home', icon: LayoutDashboard, roles: ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user'] },
  { title: 'Messages', url: '/dashboard/messages', icon: MessageSquare, roles: ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection'] },

  // PowerDesk Routes
  { title: 'Master Setup', url: '/dashboard/master-setup', icon: Database, roles: ['powerdesk'] },
  { title: 'User Management', url: '/dashboard/users', icon: Users, roles: ['powerdesk'] },
  { title: 'Dealers', url: '/dashboard/dealers', icon: Building2, roles: ['powerdesk'] },
  { title: 'Activity Monitor', url: '/dashboard/activity', icon: Activity, roles: ['powerdesk'] },
  { title: 'Permissions', url: '/dashboard/permissions', icon: Lock, roles: ['powerdesk'] },
  { title: 'Reports', url: '/dashboard/reports', icon: FileText, roles: ['powerdesk'] },

  // Website Manager Routes
  { title: 'Content', url: '/dashboard/content', icon: Globe, roles: ['website_manager'] },
  { title: 'SEO Settings', url: '/dashboard/seo', icon: FileText, roles: ['website_manager'] },
  { title: 'Master Data', url: '/dashboard/master-data', icon: Database, roles: ['website_manager'] },
  { title: 'Campaigns', url: '/dashboard/campaigns', icon: Tag, roles: ['website_manager'] },
  { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3, roles: ['website_manager'] },

  // Dealer Routes
  { title: 'My Inventory', url: '/dashboard/inventory', icon: Car, roles: ['dealer'] },
  { title: 'Leads', url: '/dashboard/leads', icon: UserCircle, roles: ['dealer'] },
  { title: 'Sales Pipeline', url: '/dashboard/sales-pipeline', icon: TrendingUp, roles: ['dealer'] },
  { title: 'Finance Requests', url: '/dashboard/finance-requests', icon: DollarSign, roles: ['dealer'] },
  { title: 'Inspections', url: '/dashboard/inspections', icon: CheckCircle, roles: ['dealer'] },

  // Sales Routes
  { title: 'Lead Management', url: '/dashboard/leads', icon: UserCircle, roles: ['sales'] },
  { title: 'Follow-ups', url: '/dashboard/followups', icon: ClipboardList, roles: ['sales'] },
  { title: 'Customers', url: '/dashboard/customers', icon: Users, roles: ['sales'] },
  { title: 'Deal Pipeline', url: '/dashboard/deals', icon: TrendingUp, roles: ['sales'] },
  { title: 'Performance', url: '/dashboard/performance', icon: BarChart3, roles: ['sales'] },

  // Finance Routes
  { title: 'Loan Applications', url: '/dashboard/applications', icon: FileText, roles: ['finance'] },
  { title: 'EMI Calculator', url: '/dashboard/emi-calculator', icon: Calculator, roles: ['finance'] },
  { title: 'Documents', url: '/dashboard/documents', icon: FolderOpen, roles: ['finance'] },
  { title: 'Approvals', url: '/dashboard/approvals', icon: CheckCircle, roles: ['finance'] },
  { title: 'Reports', url: '/dashboard/reports', icon: FileText, roles: ['finance'] },

  // Inspection Routes
  { title: 'Request Queue', url: '/dashboard/inspection-queue', icon: ClipboardList, roles: ['inspection'] },
  { title: 'My Reports', url: '/dashboard/inspection-reports', icon: FileCheck, roles: ['inspection'] },
  { title: 'Vehicle History', url: '/dashboard/vehicle-history', icon: Car, roles: ['inspection'] },
  { title: 'Quality Metrics', url: '/dashboard/quality-metrics', icon: BarChart3, roles: ['inspection'] },

  // User (Customer) Routes
  { title: 'Saved Cars', url: '/dashboard/saved-cars', icon: Heart, roles: ['user'] },
  { title: 'My Enquiries', url: '/dashboard/enquiries', icon: Send, roles: ['user'] },
  { title: 'Test Drives', url: '/dashboard/test-drives', icon: Car, roles: ['user'] },
  { title: 'Finance Applications', url: '/dashboard/my-applications', icon: DollarSign, roles: ['user'] },
  { title: 'Order History', url: '/dashboard/orders', icon: Package, roles: ['user'] },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const { roles, staffSession } = useAuth();
  const location = useLocation();
  const { unreadMessages } = useUnreadCounts();
  const { data: pendingDealersCount } = usePendingApplicationsCount();
  const collapsed = state === 'collapsed';
  const primaryRole = roles[0] || 'user';
  const roleColor = ROLE_COLORS[primaryRole];


  const navItems: NavItem[] = [
    // Common Routes (All Roles)
    { title: 'Home', url: '/dashboard/home', icon: LayoutDashboard, roles: ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user', 'dealer_staff'] },
    { title: 'Messages', url: '/dashboard/messages', icon: MessageSquare, roles: ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user', 'dealer_staff'], badge: unreadMessages },

    // PowerDesk Routes
    { title: 'Master Setup', url: '/dashboard/master-setup', icon: Database, roles: ['powerdesk'] },
    { title: 'User Management', url: '/dashboard/users', icon: Users, roles: ['powerdesk'] },
    { title: 'Dealers', url: '/dashboard/dealers', icon: Building2, roles: ['powerdesk'], badge: pendingDealersCount || 0 },
    { title: 'Dealer Profiles', url: '/dashboard/dealer-profiles', icon: Store, roles: ['powerdesk'] },
    { title: 'All Car Listings', url: '/dashboard/car-listings', icon: Car, roles: ['powerdesk'] },
    { title: 'Demand Gaps', url: '/dashboard/demand-gaps', icon: TrendingDown, roles: ['powerdesk'] },
    { title: 'Activity Monitor', url: '/dashboard/activity', icon: Activity, roles: ['powerdesk'] },
    { title: 'Plans Management', url: '/dashboard/subscription-management', icon: Wrench, roles: ['powerdesk'] },
    { title: 'Permissions', url: '/dashboard/permissions', icon: Lock, roles: ['powerdesk'] },
    { title: 'Reports', url: '/dashboard/reports', icon: FileText, roles: ['powerdesk'] },
    { title: 'Gallery', url: '/dashboard/gallery', icon: Image, roles: ['powerdesk', 'website_manager'] },

    // Analytics Routes
    { title: 'Lead Intelligence', url: '/dashboard/lead-intelligence', icon: Brain, roles: ['powerdesk', 'sales'] },
    { title: 'Dealer Analytics', url: '/dashboard/dealer-analytics', icon: Gauge, roles: ['powerdesk', 'dealer'] },
    { title: 'Market Intelligence', url: '/dashboard/market-intelligence', icon: Target, roles: ['powerdesk', 'dealer'] },
    { title: 'User Intelligence', url: '/dashboard/user-intelligence', icon: User, roles: ['powerdesk', 'sales'] },
    { title: 'AI Suggestions', url: '/dashboard/ai-suggestions', icon: Lightbulb, roles: ['powerdesk', 'dealer'] },
    { title: 'Conversion Analytics', url: '/dashboard/conversion-analytics', icon: LineChart, roles: ['powerdesk', 'sales'] },
    { title: 'AI Insights', url: '/dashboard/ai-insights', icon: Sparkles, roles: ['powerdesk', 'dealer'] },

    // Website Manager Routes
    { title: 'Content', url: '/dashboard/content', icon: Globe, roles: ['website_manager'] },
    { title: 'SEO Settings', url: '/dashboard/seo', icon: FileText, roles: ['website_manager'] },
    { title: 'Master Data', url: '/dashboard/master-data', icon: Database, roles: ['website_manager'] },
    { title: 'Campaigns', url: '/dashboard/campaigns', icon: Tag, roles: ['website_manager'] },
    { title: 'Analytics', url: '/dashboard/analytics', icon: BarChart3, roles: ['website_manager'] },

    // Dealer Routes
    { title: 'My Profile', url: '/dashboard/dealer-profile-info', icon: Building2, roles: ['dealer'] },
    { title: 'Team Management', url: '/dashboard/staff', icon: Shield, roles: ['dealer'] },
    { title: 'My Listings', url: '/dashboard/my-listings', icon: Package, roles: ['dealer', 'dealer_staff'] },
    { title: 'Print Stock List', url: '/dashboard/print-stock-list', icon: Printer, roles: ['powerdesk', 'dealer'] },
    { title: 'Plans', url: '/dashboard/plans', icon: DollarSign, roles: ['dealer'] },
    { title: 'Demand Gaps', url: '/dashboard/demand-gaps', icon: TrendingDown, roles: ['dealer'] },
    { title: 'Test Drive Bookings', url: '/dashboard/test-drive-bookings', icon: CalendarClock, roles: ['powerdesk', 'dealer', 'dealer_staff'] },
    { title: 'Leads', url: '/dashboard/leads', icon: UserCircle, roles: ['dealer', 'dealer_staff'] },
    { title: 'Sales Pipeline', url: '/dashboard/sales-pipeline', icon: TrendingUp, roles: ['dealer'] },
    { title: 'Finance Requests', url: '/dashboard/finance-requests', icon: DollarSign, roles: ['dealer'] },
    { title: 'Inspections', url: '/dashboard/inspections', icon: CheckCircle, roles: ['dealer'] },

    // Sales Routes
    { title: 'Lead Management', url: '/dashboard/leads', icon: UserCircle, roles: ['sales'] },
    { title: 'Follow-ups', url: '/dashboard/followups', icon: ClipboardList, roles: ['sales'] },
    { title: 'Customers', url: '/dashboard/customers', icon: Users, roles: ['sales'] },
    { title: 'Deal Pipeline', url: '/dashboard/deals', icon: TrendingUp, roles: ['sales'] },
    { title: 'Performance', url: '/dashboard/performance', icon: BarChart3, roles: ['sales'] },

    // Finance Routes
    { title: 'Loan Applications', url: '/dashboard/applications', icon: FileText, roles: ['finance'] },
    { title: 'EMI Calculator', url: '/dashboard/emi-calculator', icon: Calculator, roles: ['finance'] },
    { title: 'Documents', url: '/dashboard/documents', icon: FolderOpen, roles: ['finance'] },
    { title: 'Approvals', url: '/dashboard/approvals', icon: CheckCircle, roles: ['finance'] },
    { title: 'Reports', url: '/dashboard/reports', icon: FileText, roles: ['finance'] },

    // Inspection Routes
    { title: 'Request Queue', url: '/dashboard/inspection-queue', icon: ClipboardList, roles: ['inspection'] },
    { title: 'My Reports', url: '/dashboard/inspection-reports', icon: FileCheck, roles: ['inspection'] },
    { title: 'Vehicle History', url: '/dashboard/vehicle-history', icon: Car, roles: ['inspection'] },
    { title: 'Quality Metrics', url: '/dashboard/quality-metrics', icon: BarChart3, roles: ['inspection'] },

  ];

  const filteredItems = navItems.filter(item => {
    // 1. Check if the item is allowed for the user's primary role
    if (!item.roles.includes(primaryRole as any)) {
      return false;
    }

    // 2. Dealer Staff - Granular Permission Checks
    if (roles.includes('dealer_staff') && staffSession?.permissions) {
      if ((item.url === '/dashboard/my-listings' || item.url === '/dashboard/inventory') && !staffSession.permissions.manage_listings) {
        return false;
      }
      if (item.url === '/dashboard/leads' && !staffSession.permissions.view_leads) {
        return false;
      }
      // Hide other dealer sections not explicitly allowed (optional, or just rely on roles)
    }

    return true;
  });

  // Remove duplicates (like Overview, Messages which appear for multiple roles)
  const uniqueItems = filteredItems.reduce((acc, item) => {
    if (!acc.find(i => i.url === item.url)) {
      acc.push(item);
    }
    return acc;
  }, [] as NavItem[]);

  const isDealer = primaryRole === 'dealer' || primaryRole === 'dealer_staff';
  const iconColor = (url: string) => ICON_COLORS[url] || roleColor;

  return (
    <Sidebar
      collapsible="icon"
      className={isDealer ? "transition-all" : ""}
      style={isDealer ? {
        backgroundColor: 'hsl(var(--dealer-sidebar-bg))',
        borderRight: '1px solid hsl(var(--dealer-border-light))',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
      } : undefined}
    >
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border flex justify-center">
          <img
            src={logoImage}
            alt="PickMyCar"
            className="h-20 w-auto"
          />
        </div>
      )}

      {isDealer && !collapsed && <DealerProfileSection />}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel
            className={collapsed ? "px-2" : ""}
            style={isDealer ? {
              color: 'hsl(var(--dealer-text-muted))',
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            } : undefined}
          >
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {uniqueItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink
                        to={item.url}
                        end
                        className={`flex items-center gap-3 transition-colors ${isActive ? '' : ''
                          }`}
                        style={isDealer ? {
                          backgroundColor: isActive ? 'hsl(var(--dealer-accent-primary) / 0.12)' : 'transparent',
                          color: isActive ? 'hsl(var(--dealer-accent-primary))' : 'hsl(var(--dealer-text-secondary))',
                          borderRadius: '8px',
                          fontWeight: isActive ? '600' : '500',
                        } : isActive ? {
                          borderLeft: `3px solid ${roleColor}`,
                          paddingLeft: 'calc(1rem - 3px)',
                        } : undefined}
                      >
                        <item.icon
                          className="h-5 w-5"
                          style={isDealer ? {
                            color: isActive ? 'hsl(var(--dealer-accent-primary))' : 'hsl(var(--dealer-text-secondary))'
                          } : undefined}
                        />
                        {!collapsed && (
                          <>
                            <span className={isDealer ? "font-medium flex-1" : "flex-1"}>{item.title}</span>
                            {item.badge && typeof item.badge === 'number' && item.badge > 0 && (
                              <Badge
                                variant="default"
                                className="ml-auto h-5 min-w-5 px-1 text-xs"
                                style={isDealer ? {
                                  backgroundColor: 'hsl(var(--dealer-accent-primary))',
                                  color: 'white',
                                } : undefined}
                              >
                                {item.badge > 99 ? '99+' : item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                        {collapsed && item.badge && typeof item.badge === 'number' && item.badge > 0 && (
                          <div
                            className="h-2 w-2 rounded-full bg-primary absolute top-1 right-1"
                            aria-label={`${item.badge} unread`}
                          />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
