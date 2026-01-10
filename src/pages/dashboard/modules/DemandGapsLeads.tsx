import { useState } from 'react';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDemandGapsTable, DemandGapTableRow } from '@/hooks/useDemandGapsTable';
import { LeadDetailsDialog } from '@/components/demand-gaps/LeadDetailsDialog';
import { ShareButtons } from '@/components/demand-gaps/ShareButtons';
import { StatusDropdown } from '@/components/demand-gaps/StatusDropdown';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { Search, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function DemandGapsLeads() {
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all' as 'all' | 'high' | 'medium' | 'low',
    status: 'all',
  });
  const [selectedLead, setSelectedLead] = useState<DemandGapTableRow | null>(null);

  const { data: leads, isLoading } = useDemandGapsTable(filters);

  const getPriorityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-red-500">🔥 Hot</Badge>;
    if (score >= 50) return <Badge className="bg-orange-500">📌 Warm</Badge>;
    return <Badge variant="secondary">❄️ Cold</Badge>;
  };


  const handleExport = () => {
    if (!leads || leads.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = [
      ['Name', 'Phone', 'Location', 'Priority', 'Fuel Type', 'Budget', 'Requirements', 'Date', 'Status'],
      ...leads.map(lead => [
        lead.user_name,
        lead.user_phone,
        lead.city || 'N/A',
        lead.priority_score >= 80 ? 'Hot' : lead.priority_score >= 50 ? 'Warm' : 'Cold',
        lead.fuel_type_names,
        `₹${lead.budget_min?.toLocaleString() || '0'} - ₹${lead.budget_max?.toLocaleString() || 'N/A'}`,
        lead.note || 'None',
        new Date(lead.created_at).toLocaleDateString('en-IN'),
        lead.status,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand-gaps-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exported successfully');
  };

  const columns: ColumnDef<DemandGapTableRow>[] = [
    {
      accessorKey: 'user_name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.user_name}</div>
      ),
    },
    {
      accessorKey: 'user_phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.original.user_phone}</div>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.city || 'Not specified'}</div>
      ),
    },
    {
      accessorKey: 'priority_score',
      header: 'Priority',
      cell: ({ row }) => getPriorityBadge(row.original.priority_score),
    },
    {
      accessorKey: 'fuel_type_names',
      header: 'Fuel',
      cell: ({ row }) => (
        <div className="text-sm">{row.original.fuel_type_names}</div>
      ),
    },
    {
      accessorKey: 'budget_max',
      header: 'Budget',
      cell: ({ row }) => (
        <div className="font-medium text-sm whitespace-nowrap">
          ₹{row.original.budget_min?.toLocaleString() || '0'} - ₹{row.original.budget_max?.toLocaleString() || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'note',
      header: 'Requirements',
      cell: ({ row }) => (
        <div className="text-sm max-w-[200px] truncate" title={row.original.note || 'None'}>
          {row.original.note || 'No specific requirements'}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(row.original.created_at), { addSuffix: true })}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusDropdown
          currentStatus={row.original.status}
          leadId={row.original.id}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShareButtons lead={row.original} size="icon" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedLead(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <div className="p-6">Loading leads...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">📋 Demand Gap Leads</h1>
          <p className="text-muted-foreground">
            Complete view of customer requirements with contact details
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, location, requirements..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
        <Select 
          value={filters.priority} 
          onValueChange={(value: any) => setFilters({ ...filters, priority: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">🔥 High Priority</SelectItem>
            <SelectItem value="medium">📌 Medium Priority</SelectItem>
            <SelectItem value="low">❄️ Low Priority</SelectItem>
          </SelectContent>
        </Select>
        <Select 
          value={filters.status} 
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={leads || []}
        searchKey="user_name"
        onRowClick={(row) => setSelectedLead(row)}
      />

      {/* Details Dialog */}
      <LeadDetailsDialog
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
      />
    </div>
  );
}
