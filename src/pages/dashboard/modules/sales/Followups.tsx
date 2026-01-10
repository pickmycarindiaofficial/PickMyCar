import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Phone, Mail, MessageSquare } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

type Followup = {
  customer_name: string;
  lead_type: string;
  last_contact: string;
  next_followup: string;
  priority: string;
  status: string;
};

export default function Followups() {
  const columns: ColumnDef<Followup>[] = [
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'lead_type', header: 'Lead Type' },
    { accessorKey: 'last_contact', header: 'Last Contact' },
    { accessorKey: 'next_followup', header: 'Next Follow-up' },
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
          scheduled: 'bg-blue-500/10 text-blue-500',
          completed: 'bg-green-500/10 text-green-500',
        };
        return (
          <Badge className={statusColors[row.original.status]}>
            {row.original.status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Phone className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Mail className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mockData: Followup[] = [
    {
      customer_name: 'John Doe',
      lead_type: 'Hot',
      last_contact: '2025-01-14',
      next_followup: '2025-01-17',
      priority: 'high',
      status: 'pending',
    },
    {
      customer_name: 'Jane Smith',
      lead_type: 'Warm',
      last_contact: '2025-01-13',
      next_followup: '2025-01-18',
      priority: 'medium',
      status: 'scheduled',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Follow-ups</h1>
        <p className="text-muted-foreground text-lg">
          Track and manage customer follow-ups
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Due Today</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">15</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Calendar className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={mockData} searchKey="customer_name" />
    </div>
  );
}
