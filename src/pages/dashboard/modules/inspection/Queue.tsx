import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList, Eye, CheckCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

type InspectionRequest = {
  request_id: string;
  car_details: string;
  dealer: string;
  priority: string;
  status: string;
  requested_date: string;
};

export default function Queue() {
  const columns: ColumnDef<InspectionRequest>[] = [
    { accessorKey: 'request_id', header: 'Request ID' },
    { accessorKey: 'car_details', header: 'Vehicle' },
    { accessorKey: 'dealer', header: 'Dealer' },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priorityColors: Record<string, string> = {
          high: 'bg-red-500/10 text-red-500',
          medium: 'bg-orange-500/10 text-orange-500',
          low: 'bg-blue-500/10 text-blue-500',
        };
        return (
          <Badge className={priorityColors[row.original.priority]}>
            {row.original.priority}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-500/10 text-yellow-500',
          in_progress: 'bg-blue-500/10 text-blue-500',
          completed: 'bg-green-500/10 text-green-500',
        };
        return (
          <Badge className={statusColors[row.original.status]}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    { accessorKey: 'requested_date', header: 'Requested' },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="default">
            <CheckCircle className="h-4 w-4" />
            Start
          </Button>
        </div>
      ),
    },
  ];

  const mockData: InspectionRequest[] = [
    {
      request_id: 'INS-001',
      car_details: 'Honda City 2020 - DL01AB1234',
      dealer: 'AutoWorld Motors',
      priority: 'high',
      status: 'pending',
      requested_date: '2025-01-15',
    },
    {
      request_id: 'INS-002',
      car_details: 'Maruti Swift 2019 - DL02CD5678',
      dealer: 'Prime Cars',
      priority: 'medium',
      status: 'in_progress',
      requested_date: '2025-01-14',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Inspection Queue</h1>
        <p className="text-muted-foreground text-lg">
          Manage vehicle inspection requests
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <ClipboardList className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">18</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <ClipboardList className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <ClipboardList className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={mockData} searchKey="dealer" />
    </div>
  );
}
