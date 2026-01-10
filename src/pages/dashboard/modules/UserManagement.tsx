import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Download, Eye, Loader2, MapPin, TrendingUp, DollarSign, 
  ShoppingCart, Activity, CheckCircle, Clock, ChevronLeft, X
} from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { UserDetailsDrawer } from '@/components/dashboard/UserDetailsDrawer';
import { UserStatsCards } from '@/components/dashboard/UserStatsCards';
import { useUserIntelligence } from '@/hooks/useUserIntelligence';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import logo from '@/assets/logo.png';

const FILTER_OPTIONS = {
  intent: [
    { value: 'all', label: 'All Intents' },
    { value: 'hot', label: '🔥 Hot' },
    { value: 'warm', label: '🌤 Warm' },
    { value: 'cold', label: '❄️ Cold' },
  ],
  budget: [
    { value: 'all', label: 'All Budgets' },
    { value: '< ₹5L', label: '< ₹5L' },
    { value: '₹5-10L', label: '₹5-10L' },
    { value: '₹10-20L', label: '₹10-20L' },
    { value: '₹20-50L', label: '₹20-50L' },
    { value: '₹50L +', label: '₹50L +' },
  ],
  buyingMode: [
    { value: 'all', label: 'All Modes' },
    { value: 'cash', label: '💳 Cash' },
    { value: 'loan', label: '🏦 Loan' },
    { value: 'undecided', label: '? Undecided' },
  ],
  engagement: [
    { value: 'all', label: 'All Engagement' },
    { value: 'high', label: 'High (>70)' },
    { value: 'medium', label: 'Medium (40-70)' },
    { value: 'low', label: 'Low (<40)' },
  ],
  quizCompleted: [
    { value: 'all', label: 'All Users' },
    { value: 'yes', label: '✅ Completed' },
    { value: 'no', label: '❌ Not Done' },
  ],
  lastSeen: [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ],
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    intent: 'all',
    budget: 'all',
    buyingMode: 'all',
    engagement: 'all',
    quizCompleted: 'all',
    lastSeen: 'all',
    search: '',
    location: 'all',
  });
  
  const { data, isLoading } = useUserIntelligence(filters);

  // Add body class for full-screen mode
  useEffect(() => {
    document.body.classList.add('user-intelligence-fullscreen');
    return () => {
      document.body.classList.remove('user-intelligence-fullscreen');
    };
  }, []);
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const exportToCSV = () => {
    if (!data?.users) return;
    
    const headers = ['Name', 'Phone', 'Intent', 'Budget', 'Buying Mode', 'Engagement', 'Cars Viewed', 'Shortlisted', 'Contacts'];
    const rows = data.users.map((u: any) => [
      u.full_name,
      u.phone_number,
      `${u.city_name || 'Not set'}${u.state_name ? ', ' + u.state_name : ''}`,
      u.intent || '-',
      u.budget_band || '-',
      u.buying_mode || '-',
      u.engagement_score || 0,
      u.cars_viewed || 0,
      u.cars_shortlisted || 0,
      u.dealer_contacts || 0,
    ]);
    
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-intelligence-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.full_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.phone_number}</p>
        </div>
      ),
    },
    {
      accessorKey: 'intent',
      header: 'Intent',
      cell: ({ row }) => {
        const intent = row.original.intent;
        if (!intent) return <span className="text-muted-foreground">-</span>;
        
        const config = {
          hot: { icon: '🔥', color: 'bg-red-100 text-red-700 border-red-300' },
          warm: { icon: '🌤', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
          cold: { icon: '❄️', color: 'bg-blue-100 text-blue-700 border-blue-300' },
        };
        
        const { icon, color } = config[intent as keyof typeof config];
        
        return (
          <Badge className={color} variant="outline">
            {icon} {intent}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'budget_band',
      header: 'Budget',
      cell: ({ row }) => row.original.budget_band || <span className="text-muted-foreground">Not set</span>,
    },
    {
      accessorKey: 'buying_mode',
      header: 'Buying Mode',
      cell: ({ row }) => {
        const mode = row.original.buying_mode;
        if (!mode) return <span className="text-muted-foreground">-</span>;
        
        return mode === 'cash' ? '💳 Cash' : mode === 'loan' ? '🏦 Loan' : '? Undecided';
      },
    },
    {
      accessorKey: 'city_name',
      header: 'Location',
      cell: ({ row }) => {
        const city = row.original.city_name;
        const state = row.original.state_name;
        
        if (!city || city === 'Unknown') {
          return (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">Not set</span>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{city}</div>
              {state && state !== 'Unknown' && (
                <div className="text-xs text-muted-foreground">{state}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'engagement_score',
      header: 'Engagement',
      cell: ({ row }) => {
        const score = row.original.engagement_score || 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  score >= 70 ? 'bg-green-500' : 
                  score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(score, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium">{score}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'quiz_completed',
      header: 'Quiz',
      cell: ({ row }) => (
        row.original.quiz_completed ? (
          <Badge variant="outline" className="bg-[#edf1ff] text-blue-700 border-blue-300">✅</Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-300">❌</Badge>
        )
      ),
    },
    {
      accessorKey: 'last_seen',
      header: 'Last Seen',
      cell: ({ row }) => (
        row.original.last_seen ? 
          format(new Date(row.original.last_seen), 'dd MMM, HH:mm') : 
          <span className="text-muted-foreground">Never</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedUser(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];
  
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => key !== 'search' && value !== 'all'
  ).length;

  const resetAllFilters = () => {
    setFilters({
      intent: 'all',
      budget: 'all',
      buyingMode: 'all',
      engagement: 'all',
      quizCompleted: 'all',
      lastSeen: 'all',
      search: '',
      location: 'all',
    });
  };

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 flex overflow-hidden bg-background">
      {/* Left Filter Panel */}
      <aside 
        className={`${
          showFilters ? 'w-80' : 'w-0'
        } transition-all duration-300 border-r bg-muted/30 overflow-hidden flex flex-col`}
      >
        {showFilters && (
          <>
            {/* Logo Section */}
            <div className="p-6 border-b bg-background flex items-center justify-center">
              <img 
                src={logo} 
                alt="PickMyCar" 
                className="h-10 w-auto"
              />
            </div>

            {/* Filter Header */}
            <div className="p-6 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-lg">Advanced Filters</h2>
                </div>
                {activeFilterCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground">
                    {activeFilterCount} active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Refine your user intelligence data
              </p>
            </div>

            {/* Filter Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Search */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Search className="h-3 w-3" />
                  Search Users
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name or phone..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>

              {/* Intent Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Buying Intent
                </Label>
                <Select
                  value={filters.intent}
                  onValueChange={(value) => handleFilterChange('intent', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.intent.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Budget Range
                </Label>
                <Select
                  value={filters.budget}
                  onValueChange={(value) => handleFilterChange('budget', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.budget.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Buying Mode Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ShoppingCart className="h-3 w-3" />
                  Buying Mode
                </Label>
                <Select
                  value={filters.buyingMode}
                  onValueChange={(value) => handleFilterChange('buyingMode', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.buyingMode.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Engagement Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Engagement Level
                </Label>
                <Select
                  value={filters.engagement}
                  onValueChange={(value) => handleFilterChange('engagement', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.engagement.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quiz Status Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <CheckCircle className="h-3 w-3" />
                  Quiz Status
                </Label>
                <Select
                  value={filters.quizCompleted}
                  onValueChange={(value) => handleFilterChange('quizCompleted', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.quizCompleted.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Last Activity Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last Activity
                </Label>
                <Select
                  value={filters.lastSeen}
                  onValueChange={(value) => handleFilterChange('lastSeen', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.lastSeen.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Location
                </Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {Array.from(new Set(
                      data?.users
                        ?.map((u: any) => u.city_name)
                        .filter((c: string) => c && c !== 'Unknown')
                    )).sort().map((city: string) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="p-6 border-t bg-background/50 backdrop-blur-sm space-y-3">
              <Button
                variant="outline"
                onClick={resetAllFilters}
                className="w-full"
                disabled={activeFilterCount === 0}
              >
                Reset All Filters
              </Button>
              <Button
                onClick={exportToCSV}
                className="w-full"
                disabled={!data?.users?.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
          {/* Left Section - Navigation & Title */}
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            
            {/* Divider */}
            <div className="h-6 w-px bg-border" />
            
            {/* Filter Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              {showFilters ? (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  Hide Filters
                </>
              ) : (
                <>
                  <Filter className="h-4 w-4" />
                  Show Filters
                </>
              )}
            </Button>
            
            {/* Divider */}
            <div className="h-6 w-px bg-border" />
            
            {/* Page Title & Context */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Intelligence</h1>
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  'Loading...'
                ) : (
                  <>
                    {data?.stats?.total || 0} total users
                    {activeFilterCount > 0 && ` • ${activeFilterCount} filters active`}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              size="sm"
              disabled={!data?.users?.length}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="px-4 py-3 border-b bg-muted/20 flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'search' || value === 'all') return null;
              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {key === 'intent' && '🔥'}
                  {key === 'budget' && '💰'}
                  {key === 'buyingMode' && '💳'}
                  {key === 'engagement' && '📊'}
                  {key === 'quizCompleted' && '✅'}
                  {key === 'lastSeen' && '🕐'}
                  {key === 'location' && '📍'}
                  <span className="text-xs">{value}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleFilterChange(key, 'all')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Stats Overview */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
          <div className="flex gap-4 overflow-x-auto pb-2">
            <UserStatsCards stats={data?.stats} />
          </div>
        </div>

        {/* Data Table - Scrollable */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <Card className="border-0 shadow-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="p-6">
                <DataTable 
                  columns={columns} 
                  data={data?.users || []}
                  onRowClick={(user) => setSelectedUser(user)}
                />
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* User Details Drawer */}
      <UserDetailsDrawer 
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
