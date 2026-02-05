import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/common/StatsCard';
import {
  Users, Car, MessageSquare, TrendingUp, DollarSign, Activity,
  Settings, Database, FileText, BarChart3, ArrowRight, Loader2
} from 'lucide-react';
import { ROLE_LABELS } from '@/types/auth';
import { useDealerDashboardStats } from '@/hooks/useDealerDashboardStats';
import { useMemo } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
export function DashboardHome() {
  const { profile, roles, user } = useAuth();
  const isMobile = useIsMobile();


  const navigate = useNavigate();
  const primaryRole = roles[0] || 'user';
  const isDealer = primaryRole === 'dealer';

  // Get dealer ID from localStorage for dealer sessions
  const dealerId = useMemo(() => {
    if (!isDealer) return null;
    try {
      const dealerInfoStr = localStorage.getItem('dealer_info');
      if (dealerInfoStr) {
        const dealerInfo = JSON.parse(dealerInfoStr);
        return dealerInfo.id;
      }
    } catch (e) {
      console.error('Error parsing dealer info:', e);
    }
    return user?.id || null;
  }, [isDealer, user?.id]);

  // Fetch real dealer dashboard stats
  const { data: dealerStats, isLoading: isLoadingStats } = useDealerDashboardStats(dealerId);

  // Role-specific quick actions
  const quickActions = {
    powerdesk: [
      { label: 'Master Setup', icon: Database, path: '/dashboard/master-setup' },
      { label: 'User Management', icon: Users, path: '/dashboard/users' },
      { label: 'Activity Monitor', icon: Activity, path: '/dashboard/activity' },
      { label: 'Permissions', icon: Settings, path: '/dashboard/permissions' },
    ],
    website_manager: [
      { label: 'Content Management', icon: FileText, path: '/dashboard/content' },
      { label: 'SEO Settings', icon: BarChart3, path: '/dashboard/seo' },
      { label: 'Campaigns', icon: TrendingUp, path: '/dashboard/campaigns' },
      { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    ],
    dealer: [
      { label: 'My Inventory', icon: Car, path: '/dashboard/inventory' },
      { label: 'Leads', icon: Users, path: '/dashboard/leads' },
      { label: 'Sales Pipeline', icon: TrendingUp, path: '/dashboard/sales-pipeline' },
      { label: 'Messages', icon: MessageSquare, path: '/dashboard/messages' },
    ],
    sales: [
      { label: 'Lead Management', icon: Users, path: '/dashboard/leads' },
      { label: 'Follow-ups', icon: MessageSquare, path: '/dashboard/followups' },
      { label: 'Deal Pipeline', icon: TrendingUp, path: '/dashboard/deals' },
      { label: 'Performance', icon: BarChart3, path: '/dashboard/performance' },
    ],
    finance: [
      { label: 'Loan Applications', icon: FileText, path: '/dashboard/applications' },
      { label: 'EMI Calculator', icon: DollarSign, path: '/dashboard/emi-calculator' },
      { label: 'Approvals', icon: Activity, path: '/dashboard/approvals' },
      { label: 'Reports', icon: BarChart3, path: '/dashboard/reports' },
    ],
    inspection: [
      { label: 'Request Queue', icon: Activity, path: '/dashboard/inspection-queue' },
      { label: 'My Reports', icon: FileText, path: '/dashboard/inspection-reports' },
      { label: 'Vehicle History', icon: Car, path: '/dashboard/vehicle-history' },
      { label: 'Quality Metrics', icon: BarChart3, path: '/dashboard/quality-metrics' },
    ],
    user: [
      { label: 'Browse Cars', icon: Car, path: '/' },
      { label: 'Saved Cars', icon: Car, path: '/dashboard/saved-cars' },
      { label: 'My Enquiries', icon: MessageSquare, path: '/dashboard/enquiries' },
      { label: 'Finance Applications', icon: DollarSign, path: '/dashboard/my-applications' },
    ],
  };

  const actions = quickActions[primaryRole] || quickActions.user;

  // Role-specific metrics
  const metrics = {
    powerdesk: [
      { title: 'Total Users', value: '248', icon: Users, trend: { value: '+12%', isPositive: true } },
      { title: 'Active Cars', value: '1,234', icon: Car, trend: { value: '+8%', isPositive: true } },
      { title: 'Messages Today', value: '89', icon: MessageSquare, trend: { value: '+23%', isPositive: true } },
      { title: 'System Health', value: '98%', icon: Activity, trend: { value: '+2%', isPositive: true } },
    ],
    website_manager: [
      { title: 'Page Views', value: '45.2K', icon: TrendingUp, trend: { value: '+18%', isPositive: true } },
      { title: 'Active Campaigns', value: '12', icon: Activity, trend: { value: '+3', isPositive: true } },
      { title: 'SEO Score', value: '92', icon: TrendingUp, trend: { value: '+5', isPositive: true } },
      { title: 'Conversion Rate', value: '3.2%', icon: DollarSign, trend: { value: '+0.4%', isPositive: true } },
    ],
    dealer: [
      { title: 'My Cars', value: isLoadingStats ? '...' : String(dealerStats?.myCars ?? 0), icon: Car, trend: { value: '+5', isPositive: true } },
      { title: 'Active Leads', value: isLoadingStats ? '...' : String(dealerStats?.activeLeads ?? 0), icon: Users, trend: { value: '+8', isPositive: true } },
      { title: 'This Month Sales', value: isLoadingStats ? '...' : String(dealerStats?.thisMonthSales ?? 0), icon: DollarSign, trend: { value: '+4', isPositive: true } },
      { title: 'Pending Inspections', value: isLoadingStats ? '...' : String(dealerStats?.pendingInspections ?? 0), icon: Activity, trend: { value: '+2', isPositive: true } },
    ],
    sales: [
      { title: 'Active Leads', value: '67', icon: Users, trend: { value: '+12', isPositive: true } },
      { title: 'Follow-ups Today', value: '15', icon: MessageSquare, trend: { value: '0', isPositive: true } },
      { title: 'Deals Closed', value: '8', icon: DollarSign, trend: { value: '+3', isPositive: true } },
      { title: 'Conversion Rate', value: '12%', icon: TrendingUp, trend: { value: '+2%', isPositive: true } },
    ],
    finance: [
      { title: 'Pending Applications', value: '34', icon: Activity, trend: { value: '+7', isPositive: true } },
      { title: 'Approved Today', value: '12', icon: TrendingUp, trend: { value: '+5', isPositive: true } },
      { title: 'Total Value', value: '$2.4M', icon: DollarSign, trend: { value: '+15%', isPositive: true } },
      { title: 'Approval Rate', value: '85%', icon: TrendingUp, trend: { value: '+3%', isPositive: true } },
    ],
    inspection: [
      { title: 'Pending Requests', value: '18', icon: Activity, trend: { value: '+4', isPositive: true } },
      { title: 'Completed Today', value: '9', icon: TrendingUp, trend: { value: '+2', isPositive: true } },
      { title: 'Quality Score', value: '94%', icon: TrendingUp, trend: { value: '+1%', isPositive: true } },
      { title: 'Avg. Time', value: '2.5h', icon: Activity, trend: { value: '-0.3h', isPositive: true } },
    ],
    user: [
      { title: 'Saved Cars', value: '12', icon: Car, trend: { value: '+2', isPositive: true } },
      { title: 'Active Enquiries', value: '3', icon: MessageSquare, trend: { value: '0', isPositive: true } },
      { title: 'Test Drives', value: '2', icon: Activity, trend: { value: '+1', isPositive: true } },
      { title: 'Applications', value: '1', icon: DollarSign, trend: { value: '+1', isPositive: true } },
    ],
  };

  const roleMetrics = metrics[primaryRole] || metrics.user;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className={`text-3xl font-bold tracking-tight lg:text-4xl ${isDealer ? 'text-2xl' : ''}`} style={isDealer ? { color: 'hsl(var(--dealer-text-primary))' } : undefined}>
          {isDealer ? 'Dashboard Reports' : `Welcome back, ${profile?.full_name}`}
        </h1>
        <p className={isDealer ? "text-sm font-medium" : "text-muted-foreground text-lg"} style={isDealer ? { color: 'hsl(var(--dealer-text-secondary))' } : undefined}>
          {isDealer ? 'Dashboard Overview' : `Here's what's happening with your ${ROLE_LABELS[primaryRole]} account`}
        </p>
      </div>

      {/* Role Badges */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: `hsl(var(--role-${role}) / 0.1)`,
              color: `hsl(var(--role-${role}))`,
              border: `1px solid hsl(var(--role-${role}) / 0.3)`,
            }}
          >
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      {/* Metrics Grid - Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop */}
      {/* Metrics Grid - Responsive: 1 col mobile, 2 cols tablet, 4 cols desktop */}
      {isMobile ? (
        <div className="grid grid-cols-4 gap-2">
          {roleMetrics.map((metric, index) => (
            <div key={index} className="bg-card border rounded-lg p-2 text-center shadow-sm flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-xl font-bold leading-none mb-1">{metric.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase leading-tight line-clamp-2">
                {metric.title.replace('Total ', '').replace('Active ', '').replace('This Month ', '').replace('Pending ', '')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {roleMetrics.map((metric, index) => (
            <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <StatsCard
                title={metric.title}
                value={metric.value}
                icon={metric.icon}
                trend={isDealer ? undefined : metric.trend}
                isDealer={isDealer}
                index={index}
              />
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions - Responsive Grid */}
      {isDealer ? (
        <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: '1px solid hsl(var(--dealer-border-light))' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--dealer-text-primary))' }}>
            Quick Actions
          </h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50"
                style={{
                  border: '1px solid hsl(var(--dealer-border-light))',
                  textAlign: 'left'
                }}
              >
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: index === 0
                      ? 'hsl(var(--dealer-accent-primary) / 0.15)'
                      : index === 1
                        ? 'hsl(var(--dealer-accent-green) / 0.15)'
                        : index === 2
                          ? 'hsl(var(--dealer-accent-purple) / 0.15)'
                          : 'hsl(var(--dealer-accent-orange) / 0.15)'
                  }}
                >
                  <action.icon
                    className="h-5 w-5"
                    style={{
                      color: index === 0
                        ? 'hsl(var(--dealer-accent-primary))'
                        : index === 1
                          ? 'hsl(var(--dealer-accent-green))'
                          : index === 2
                            ? 'hsl(var(--dealer-accent-purple))'
                            : 'hsl(var(--dealer-accent-orange))'
                    }}
                  />
                </div>
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--dealer-text-primary))' }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <Card className="shadow-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-5 justify-start hover-scale group"
                  onClick={() => navigate(action.path)}
                >
                  <action.icon className="mr-3 h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-medium text-sm">{action.label}</span>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card
        className="shadow-sm"
        style={isDealer ? {
          borderRadius: '12px',
          border: '1px solid hsl(var(--dealer-border-light))'
        } : {}}
      >
        <CardHeader>
          <CardTitle className="text-lg font-semibold" style={isDealer ? { color: 'hsl(var(--dealer-text-primary))' } : undefined}>
            Recent Publications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isDealer && isLoadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : isDealer && dealerStats?.recentActivity && dealerStats.recentActivity.length > 0 ? (
              dealerStats.recentActivity.map((activity, index) => (
                <div key={activity.id} className="flex items-center gap-3 pb-3 border-b last:border-b-0" style={isDealer ? { borderColor: 'hsl(var(--dealer-border-light))' } : undefined}>
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: activity.type === 'enquiry' ? 'hsl(var(--dealer-accent-green))' : 'hsl(var(--dealer-accent-primary))' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={isDealer ? { color: 'hsl(var(--dealer-text-primary))' } : undefined}>
                      {activity.title}
                    </p>
                    <p className="text-xs" style={isDealer ? { color: 'hsl(var(--dealer-text-secondary))' } : undefined}>
                      {activity.timeAgo}
                    </p>
                  </div>
                </div>
              ))
            ) : isDealer ? (
              <p className="text-sm text-muted-foreground py-2">No recent activity</p>
            ) : (
              [1, 2, 3].map((_, index) => (
                <div key={index} className="flex items-center gap-3 pb-3 border-b last:border-b-0">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Activity item {index + 1}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2 hours ago
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
