import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDealerProfiles } from '@/hooks/useDealerProfiles';
import { useCities } from '@/hooks/useCities';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatsCard } from '@/components/common/StatsCard';
import { Building2, CheckCircle, AlertCircle, BarChart, Edit, Search, Store } from 'lucide-react';

export default function DealerProfiles() {
  const navigate = useNavigate();
  const { data: dealers, isLoading } = useDealerProfiles();
  const { data: cities } = useCities();

  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');

  // Calculate stats
  const stats = useMemo(() => {
    if (!dealers) return { total: 0, complete: 0, incomplete: 0, avgCompletion: 0 };

    const total = dealers.length;
    const complete = dealers.filter(d => d.profile_completion >= 80).length;
    const incomplete = total - complete;
    const avgCompletion = total > 0
      ? Math.round(dealers.reduce((sum, d) => sum + d.profile_completion, 0) / total)
      : 0;

    return { total, complete, incomplete, avgCompletion };
  }, [dealers]);

  // Filter dealers
  const filteredDealers = useMemo(() => {
    if (!dealers) return [];

    return dealers.filter(dealer => {
      // Search filter
      const matchesSearch = !searchQuery || 
        dealer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dealer.dealership_name.toLowerCase().includes(searchQuery.toLowerCase());

      // City filter
      const matchesCity = cityFilter === 'all' || dealer.city_name === cityFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && dealer.is_active) ||
        (statusFilter === 'inactive' && !dealer.is_active);

      // Completion filter
      const matchesCompletion = completionFilter === 'all' ||
        (completionFilter === 'complete' && dealer.profile_completion >= 80) ||
        (completionFilter === 'incomplete' && dealer.profile_completion < 80);

      return matchesSearch && matchesCity && matchesStatus && matchesCompletion;
    });
  }, [dealers, searchQuery, cityFilter, statusFilter, completionFilter]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dealer Profiles</h2>
          <p className="text-muted-foreground">
            Manage dealer profile information and visibility settings
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Dealers"
          value={stats.total.toString()}
          icon={Building2}
        />
        <StatsCard
          title="Complete Profiles"
          value={stats.complete.toString()}
          icon={CheckCircle}
          trend={{ value: `${Math.round((stats.complete / stats.total) * 100) || 0}% of total`, isPositive: true }}
        />
        <StatsCard
          title="Incomplete"
          value={stats.incomplete.toString()}
          icon={AlertCircle}
        />
        <StatsCard
          title="Avg Completion"
          value={`${stats.avgCompletion}%`}
          icon={BarChart}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dealers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities?.map((city) => (
                <SelectItem key={city.id} value={city.name}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={completionFilter} onValueChange={setCompletionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Profile Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              <SelectItem value="complete">Complete (≥80%)</SelectItem>
              <SelectItem value="incomplete">Incomplete (&lt;80%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Dealers Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dealer</TableHead>
              <TableHead>Dealership</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDealers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No dealers found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredDealers.map((dealer) => (
                <TableRow key={dealer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={dealer.avatar_url || dealer.logo_url || undefined} />
                        <AvatarFallback>{getInitials(dealer.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{dealer.full_name}</div>
                        <div className="text-sm text-muted-foreground">@{dealer.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      {dealer.dealership_name}
                    </div>
                  </TableCell>
                  <TableCell>{dealer.city_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={dealer.is_active ? 'default' : 'secondary'}>
                      {dealer.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <Progress value={dealer.profile_completion} className="w-20" />
                      <span className="text-sm font-medium whitespace-nowrap">
                        {dealer.profile_completion}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{dealer.total_listings}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard/dealer-profile-info/${dealer.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
