import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-blue-500', icon: Clock },
  new_lead: { label: 'New Lead', color: 'bg-blue-500', icon: FileText },
  document_pending: { label: 'Docs Pending', color: 'bg-yellow-500', icon: Clock },
  docs_received: { label: 'Docs Received', color: 'bg-purple-500', icon: CheckCircle2 },
  bank_underwriting: { label: 'Underwriting', color: 'bg-orange-500', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-500', icon: XCircle },
};

export default function LoanApplications() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  // Fetch stats with detailed logging
  const { data: stats, error: statsError, isLoading: statsLoading } = useQuery({
    queryKey: ['loan-stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_loan_application_stats');

      if (error) throw error;

      return data || {
        total_applications: 0,
        pending_count: 0,
        approved_count: 0,
        rejected_count: 0,
        total_approved_amount: 0,
        avg_processing_days: 0
      };
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  // Fetch applications
  const { data: applications, isLoading, error: appsError } = useQuery({
    queryKey: ['loan-applications', statusFilter],
    queryFn: async () => {
      let query = (supabase as any)
        .from('loan_applications')
        .select(`
          *,
          cities (name),
          car_listings (
            brand_id,
            model_id,
            brands (name),
            models (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });


  const filteredApplications = applications?.filter((app: any) =>
    app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.phone_number.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {(statsError || appsError) && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="font-semibold text-destructive">⚠️ Error Loading Data</p>
              {statsError && (
                <div className="text-sm">
                  <p className="font-medium">Stats Error:</p>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">
                    {JSON.stringify(statsError, null, 2)}
                  </pre>
                </div>
              )}
              {appsError && (
                <div className="text-sm">
                  <p className="font-medium">Applications Error:</p>
                  <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-auto">
                    {JSON.stringify(appsError, null, 2)}
                  </pre>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Check console for detailed logs. Common issues: RLS policies, missing function, or authentication.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {user && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="space-y-1 text-xs">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Stats Loading:</strong> {statsLoading ? '⏳ Yes' : '✅ No'}</p>
              <p><strong>Apps Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
              <p><strong>Total Apps:</strong> {applications?.length || 0}</p>
              <p><strong>Stats Data:</strong> {stats ? '✅ Loaded' : '❌ Not Loaded'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_applications || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved_count || 0}</div>
            <p className="text-xs text-muted-foreground">
              ₹{((stats?.total_approved_amount || 0) / 100000).toFixed(1)}L total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Action</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.pending_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avg_processing_days?.toFixed(1) || 0}d
            </div>
            <p className="text-xs text-muted-foreground">Days to decision</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Loan Applications</CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, number, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={statusFilter === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(null)}
            >
              All
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                <config.icon className="h-3 w-3 mr-1" />
                {config.label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application #</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Loan Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : filteredApplications?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications?.map((app: any) => {
                  const statusInfo = statusConfig[app.status as keyof typeof statusConfig] || {
                    label: app.status,
                    color: 'bg-gray-500',
                    icon: FileText
                  };
                  return (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-sm">
                        {app.application_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{app.full_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{app.phone_number}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{app.car_brand} {app.car_model}</div>
                          <div className="text-muted-foreground">
                            ₹{(app.car_price / 100000).toFixed(2)}L
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ₹{(app.monthly_income / 1000).toFixed(0)}k/mo
                      </TableCell>
                      <TableCell>
                        {app.approved_loan_amount ? (
                          <div className="font-medium text-green-600">
                            ₹{(app.approved_loan_amount / 100000).toFixed(2)}L
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusInfo.color} text-white`}>
                          <statusInfo.icon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedApplication(app)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
