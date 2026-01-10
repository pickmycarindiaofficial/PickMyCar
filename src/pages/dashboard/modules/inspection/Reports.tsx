import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileCheck, Eye, Download, Edit } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

type InspectionReport = {
  report_id: string;
  car_details: string;
  condition: string;
  rating: string;
  inspector: string;
  inspection_date: string;
};

export default function Reports() {
  const columns: ColumnDef<InspectionReport>[] = [
    { accessorKey: 'report_id', header: 'Report ID' },
    { accessorKey: 'car_details', header: 'Vehicle' },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }) => {
        const conditionColors: Record<string, string> = {
          excellent: 'bg-green-500/10 text-green-500',
          good: 'bg-blue-500/10 text-blue-500',
          fair: 'bg-yellow-500/10 text-yellow-500',
          poor: 'bg-red-500/10 text-red-500',
        };
        return (
          <Badge className={conditionColors[row.original.condition]}>
            {row.original.condition}
          </Badge>
        );
      },
    },
    { accessorKey: 'rating', header: 'Rating' },
    { accessorKey: 'inspector', header: 'Inspector' },
    { accessorKey: 'inspection_date', header: 'Date' },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mockData: InspectionReport[] = [
    {
      report_id: 'REP-001',
      car_details: 'Honda City 2020',
      condition: 'excellent',
      rating: '9.2/10',
      inspector: 'You',
      inspection_date: '2025-01-15',
    },
    {
      report_id: 'REP-002',
      car_details: 'Maruti Swift 2019',
      condition: 'good',
      rating: '8.5/10',
      inspector: 'You',
      inspection_date: '2025-01-14',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">My Reports</h1>
        <p className="text-muted-foreground text-lg">
          View and manage your inspection reports
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileCheck className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">124</p>
              <p className="text-sm text-muted-foreground">Total Reports</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileCheck className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-muted-foreground">This Week</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileCheck className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">8.7</p>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileCheck className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">96%</p>
              <p className="text-sm text-muted-foreground">Quality Score</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={mockData} searchKey="car_details" />
    </div>
  );
}
