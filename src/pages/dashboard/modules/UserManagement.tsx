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
          <p className="font-medium">{row.original.full_name || 'Anonymous'}</p>
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

        const { icon, color } = config[intent as keyof typeof config] || { icon: '', color: '' };

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
              <span className="font-medium">{city}</span>
              {state && state !== 'Unknown' && (
                <span className="text-xs text-muted-foreground ml-1">({state})</span>
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
                className={`h-full ${score >= 70 ? 'bg-green-500' :
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
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Intelligence</h1>
          <p className="text-muted-foreground">
            Monitor user activity, engagement, and buying intent in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportToCSV}
            variant="outline"
            disabled={!data?.users?.length}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <UserStatsCards stats={data?.stats} />

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto flex-1">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" onClick={resetAllFilters} size="sm" className="text-muted-foreground hover:text-foreground">
                  Reset
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Intent */}
              <Select value={filters.intent} onValueChange={(value) => handleFilterChange('intent', value)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.intent.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Budget */}
              <Select value={filters.budget} onValueChange={(value) => handleFilterChange('budget', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.budget.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Buying Mode */}
              <Select value={filters.buyingMode} onValueChange={(value) => handleFilterChange('buyingMode', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.buyingMode.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Engagement */}
              <Select value={filters.engagement} onValueChange={(value) => handleFilterChange('engagement', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Engagement" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_OPTIONS.engagement.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location */}
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Location" />
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
        </div>
      </Card>

      {/* Data Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-0">
            <DataTable
              columns={columns}
              data={data?.users || []}
              onRowClick={(user) => setSelectedUser(user)}
            />
          </div>
        )}
      </Card>

      {/* User Details Drawer */}
      <UserDetailsDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
