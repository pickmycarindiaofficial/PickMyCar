import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Upload } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

type Document = {
  document_name: string;
  customer_name: string;
  application_id: string;
  type: string;
  status: string;
  uploaded_date: string;
};

export default function Documents() {
  const columns: ColumnDef<Document>[] = [
    { accessorKey: 'document_name', header: 'Document' },
    { accessorKey: 'customer_name', header: 'Customer' },
    { accessorKey: 'application_id', header: 'Application' },
    { accessorKey: 'type', header: 'Type' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusColors: Record<string, string> = {
          verified: 'bg-green-500/10 text-green-500',
          pending: 'bg-yellow-500/10 text-yellow-500',
          rejected: 'bg-red-500/10 text-red-500',
        };
        return (
          <Badge className={statusColors[row.original.status]}>
            {row.original.status}
          </Badge>
        );
      },
    },
    { accessorKey: 'uploaded_date', header: 'Uploaded' },
    {
      id: 'actions',
      header: 'Actions',
      cell: () => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const mockData: Document[] = [
    {
      document_name: 'Aadhar Card.pdf',
      customer_name: 'John Doe',
      application_id: 'LA-001',
      type: 'Identity Proof',
      status: 'verified',
      uploaded_date: '2025-01-15',
    },
    {
      document_name: 'Income Certificate.pdf',
      customer_name: 'Jane Smith',
      application_id: 'LA-002',
      type: 'Income Proof',
      status: 'pending',
      uploaded_date: '2025-01-14',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Document Management</h1>
          <p className="text-muted-foreground text-lg">
            Manage loan application documents
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">128</p>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={mockData} searchKey="customer_name" />
    </div>
  );
}
