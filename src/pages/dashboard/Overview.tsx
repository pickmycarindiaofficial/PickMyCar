import { useIsMobile } from '@/hooks/use-mobile';
// ... imports

export default function Overview() {
  const isMobile = useIsMobile();
  // ... existing code ...



  // Role-specific metrics
  const metrics = {
    powerdesk: [
      { title: 'Total Users', value: '248', icon: Users, change: '+12%' },
      { title: 'Active Cars', value: '1,234', icon: Car, change: '+8%' },
      { title: 'Messages Today', value: '89', icon: MessageSquare, change: '+23%' },
      { title: 'System Health', value: '98%', icon: Activity, change: '+2%' },
    ],
    website_manager: [
      { title: 'Page Views', value: '45.2K', icon: TrendingUp, change: '+18%' },
      { title: 'Active Campaigns', value: '12', icon: Activity, change: '+3' },
      { title: 'SEO Score', value: '92', icon: TrendingUp, change: '+5' },
      { title: 'Conversion Rate', value: '3.2%', icon: DollarSign, change: '+0.4%' },
    ],
    dealer: [
      { title: 'My Cars', value: '45', icon: Car, change: '+5' },
      { title: 'Active Leads', value: '23', icon: Users, change: '+8' },
      { title: 'This Month Sales', value: '12', icon: DollarSign, change: '+4' },
      { title: 'Pending Inspections', value: '7', icon: Activity, change: '+2' },
    ],
    sales: [
      { title: 'Active Leads', value: '67', icon: Users, change: '+12' },
      { title: 'Follow-ups Today', value: '15', icon: MessageSquare, change: '0' },
      { title: 'Deals Closed', value: '8', icon: DollarSign, change: '+3' },
      { title: 'Conversion Rate', value: '12%', icon: TrendingUp, change: '+2%' },
    ],
    finance: [
      { title: 'Pending Applications', value: '34', icon: Activity, change: '+7' },
      { title: 'Approved Today', value: '12', icon: TrendingUp, change: '+5' },
      { title: 'Total Value', value: '$2.4M', icon: DollarSign, change: '+15%' },
      { title: 'Approval Rate', value: '85%', icon: TrendingUp, change: '+3%' },
    ],
    inspection: [
      { title: 'Pending Requests', value: '18', icon: Activity, change: '+4' },
      { title: 'Completed Today', value: '9', icon: TrendingUp, change: '+2' },
      { title: 'Quality Score', value: '94%', icon: TrendingUp, change: '+1%' },
      { title: 'Avg. Time', value: '2.5h', icon: Activity, change: '-0.3h' },
    ],
    user: [
      { title: 'Saved Cars', value: '12', icon: Car, change: '+2' },
      { title: 'Active Enquiries', value: '3', icon: MessageSquare, change: '0' },
      { title: 'Test Drives', value: '2', icon: Activity, change: '+1' },
      { title: 'Applications', value: '1', icon: DollarSign, change: '+1' },
    ],
  };

  // Get metrics for the primary role
  const primaryRole = roles[0] || 'user';
  const roleMetrics = metrics[primaryRole] || metrics.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name}
        </p>
      </div>

      {/* Role Badge */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <span
            key={role}
            className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary"
          >
            {ROLE_LABELS[role]}
          </span>
        ))}
      </div>

      {/* Metrics Grid */}
      {/* Metrics Grid */}
      {isMobile ? (
        <div className="grid grid-cols-4 gap-2">
          {roleMetrics.map((metric, index) => (
            <div key={index} className="bg-card border rounded-lg p-2 text-center shadow-sm flex flex-col items-center justify-center min-h-[80px]">
              <div className="text-xl font-bold leading-none mb-1">{metric.value}</div>
              <div className="text-[10px] text-muted-foreground uppercase leading-tight line-clamp-2">
                {metric.title.replace('Total ', '').replace('Active ', '')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {roleMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {metric.change}
                  </span>
                  {' '}from last period
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest actions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Account created successfully</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Role assigned: {ROLE_LABELS[primaryRole]}</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Dashboard access granted</p>
                <p className="text-xs text-muted-foreground">Just now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
