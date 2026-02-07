import { useState } from 'react';
import { useUserIntelligence } from '@/hooks/useUserIntelligence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Search, Filter, TrendingUp, DollarSign, Clock, MapPin } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const INTENT_COLORS = {
  hot: 'bg-red-500',
  warm: 'bg-orange-500',
  cold: 'bg-blue-500',
};

const BUYING_MODE_LABELS = {
  immediate: 'Immediate',
  exploring: 'Exploring',
  researching: 'Researching',
  comparing: 'Comparing',
};

export default function UserIntelligence() {
  const [filters, setFilters] = useState({
    search: '',
    intent: 'all',
    budgetMin: '',
    budgetMax: '',
    buyingMode: 'all',
    engagement: 'all',
    location: '',
  });

  // Filter out "all" values before passing to the hook
  const apiFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, value]) => value !== '' && value !== 'all')
  );

  const { data, isLoading } = useUserIntelligence(apiFilters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      intent: 'all',
      budgetMin: '',
      budgetMax: '',
      buyingMode: 'all',
      engagement: 'all',
      location: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const users = data?.users || [];
  const stats = data?.stats || { total: 0, hot: 0, warm: 0, cold: 0, new: 0, today: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Intelligence</h1>
        <p className="text-muted-foreground">Deep insights into user behavior and buying intent</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hot}</div>
            <p className="text-xs text-muted-foreground">High buying intent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
            <div className="h-2 w-2 rounded-full bg-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.warm}</div>
            <p className="text-xs text-muted-foreground">Moderate interest</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
            <p className="text-xs text-muted-foreground">Joined Today ({stats.new} in last 7 days)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Refine your user intelligence search</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, email, phone..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intent">Intent Level</Label>
              <Select value={filters.intent} onValueChange={(value) => handleFilterChange('intent', value)}>
                <SelectTrigger id="intent">
                  <SelectValue placeholder="All intents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All intents</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyingMode">Buying Mode</Label>
              <Select value={filters.buyingMode} onValueChange={(value) => handleFilterChange('buyingMode', value)}>
                <SelectTrigger id="buyingMode">
                  <SelectValue placeholder="All modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="exploring">Exploring</SelectItem>
                  <SelectItem value="researching">Researching</SelectItem>
                  <SelectItem value="comparing">Comparing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetMin">Min Budget</Label>
              <Input
                id="budgetMin"
                type="number"
                placeholder="₹0"
                value={filters.budgetMin}
                onChange={(e) => handleFilterChange('budgetMin', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetMax">Max Budget</Label>
              <Input
                id="budgetMax"
                type="number"
                placeholder="₹50,00,000"
                value={filters.budgetMax}
                onChange={(e) => handleFilterChange('budgetMax', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagement">Engagement Level</Label>
              <Select value={filters.engagement} onValueChange={(value) => handleFilterChange('engagement', value)}>
                <SelectTrigger id="engagement">
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  <SelectItem value="high">High (&gt;70)</SelectItem>
                  <SelectItem value="medium">Medium (40-70)</SelectItem>
                  <SelectItem value="low">Low (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Profiles ({users.length})</CardTitle>
          <CardDescription>Detailed view of user behavior and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your filters
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Preferences</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.full_name || 'Anonymous'}</div>
                          <div className="text-xs text-muted-foreground">{user.email || user.phone_number}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={INTENT_COLORS[user.intent as keyof typeof INTENT_COLORS]}>
                          {user.intent}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-sm">
                            {user.budget_min ? `₹${(user.budget_min / 100000).toFixed(1)}L` : '—'}
                            {user.budget_max ? ` - ₹${(user.budget_max / 100000).toFixed(1)}L` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${user.engagement_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{user.engagement_score}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BUYING_MODE_LABELS[user.buying_mode as keyof typeof BUYING_MODE_LABELS] || user.buying_mode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : '—'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs space-y-1">
                          {user.preferred_brands && user.preferred_brands.length > 0 && (
                            <div className="text-muted-foreground">
                              Brands: {user.preferred_brands.slice(0, 2).join(', ')}
                            </div>
                          )}
                          {user.preferred_body_types && user.preferred_body_types.length > 0 && (
                            <div className="text-muted-foreground">
                              Types: {user.preferred_body_types.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
