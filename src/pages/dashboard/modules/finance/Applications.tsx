import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, CheckCircle, XCircle } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

type Application = {
  id: string;
  customer_name: string;
  car_model: string;
  loan_amount: string;
  status: string;
  submitted_date: string;
};

export default function Applications() {
  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: 'id',
      header: 'Application ID',
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
    },
    {
      accessorKey: 'car_model',
      header: 'Vehicle',
    },
    {
      accessorKey: 'loan_amount',
      header: 'Loan Amount',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-500/10 text-yellow-500',
          approved: 'bg-green-500/10 text-green-500',
          rejected: 'bg-red-500/10 text-red-500',
          reviewing: 'bg-blue-500/10 text-blue-500',
        };
        return (
          <Badge className={statusColors[row.original.status]}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'submitted_date',
      header: 'Date',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </Button>
          <Button size="sm" variant="outline">
            <XCircle className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const mockData: Application[] = [
    {
      id: 'LA-001',
      customer_name: 'John Doe',
      car_model: 'Honda City 2023',
      loan_amount: '₹8,50,000',
      status: 'pending',
      submitted_date: '2025-01-15',
    },
    {
      id: 'LA-002',
      customer_name: 'Jane Smith',
      car_model: 'Maruti Swift 2024',
      loan_amount: '₹6,20,000',
      status: 'approved',
      submitted_date: '2025-01-14',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Loan Applications</h1>
        <p className="text-muted-foreground text-lg">
          Review and process customer loan applications
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">14</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={mockData} searchKey="customer_name" />
    </div>
  );
}
