import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDealerListings } from '@/hooks/useDealerListings';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DealerListingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string | null;
}

export function DealerListingsDialog({ open, onOpenChange, dealerId }: DealerListingsDialogProps) {
  const navigate = useNavigate();
  const { data: listings, isLoading } = useDealerListings(dealerId);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'live':
        return 'default';
      case 'pending_verification':
        return 'secondary';
      case 'sold':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const columns = [
    {
      accessorKey: 'listing_id',
      header: 'Listing ID',
      cell: ({ row }: any) => (
        <span className="font-mono text-sm">{row.original.listing_id || 'N/A'}</span>
      ),
    },
    {
      id: 'car',
      header: 'Car',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium">{row.original.brand_name} {row.original.model_name}</p>
          <p className="text-sm text-muted-foreground">{row.original.year_of_make} • {row.original.variant}</p>
        </div>
      ),
    },
    {
      accessorKey: 'expected_price',
      header: 'Price',
      cell: ({ row }: any) => (
        <span className="font-medium">₹{row.original.expected_price?.toLocaleString('en-IN')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => (
        <Badge variant={getStatusBadgeVariant(row.original.status)}>
          {row.original.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'view_count',
      header: 'Views',
      cell: ({ row }: any) => (
        <span>{row.original.view_count || 0}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            navigate(`/car/${row.original.id}`);
            onOpenChange(false);
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];

  if (!dealerId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dealer Listings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </p>
            <DataTable
              columns={columns}
              data={listings}
              searchKey="listing_id"
              searchPlaceholder="Search by listing ID..."
            />
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No listings found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
