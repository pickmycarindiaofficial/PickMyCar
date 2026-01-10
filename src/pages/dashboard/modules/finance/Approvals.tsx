import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

type Approval = {
  application_id: string;
  customer_name: string;
  loan_amount: string;
  bank: string;
  status: string;
  priority: string;
  submitted_date: string;
};

export default function Approvals() {
  const columns: ColumnDef<Approval>[] = [
    { accessorKey: 'application_id', header: 'Application' },
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'loan_amount', header: 'Amount' },
    { accessorKey: 'bank', header: 'Bank' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          pending_approval: 'bg-yellow-500/10 text-yellow-500',
          under_review: 'bg-blue-500/10 text-blue-500',
          approved: 'bg-green-500/10 text-green-500',
          rejected: 'bg-red-500/10 text-red-500',
        };
        return (
          <Badge className={statusColors[row.original.status]}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        );
      },
    },
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
    { accessorKey: 'submitted_date', header: 'Date' },
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
          </Button>
          <Button size="sm" variant="destructive">
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mockData: Approval[] = [
    {
      application_id: 'LA-001',
      customer_name: 'John Doe',
      loan_amount: '₹8,50,000',
      bank: 'HDFC Bank',
      status: 'pending_approval',
      priority: 'high',
      submitted_date: '2025-01-15',
    },
    {
      application_id: 'LA-003',
      customer_name: 'Mike Johnson',
      loan_amount: '₹12,00,000',
      bank: 'SBI',
      status: 'under_review',
      priority: 'medium',
      submitted_date: '2025-01-16',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Approval Queue</h1>
        <p className="text-muted-foreground text-lg">
          Review and approve loan applications
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Under Review</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">48</p>
              <p className="text-sm text-muted-foreground">Approved Today</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Rejected Today</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={mockData} searchKey="customer_name" />
    </div>
  );
}
