import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { CarListingWithRelations } from '@/types/car-listing';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreHorizontal, Eye, Edit, Trash, CheckCircle, Power, PowerOff, DollarSign, Phone, Calendar, Gauge, Fuel } from 'lucide-react';
import {
  useUpdateListingStatus,
  useVerifyCarListing,
  useDeleteCarListing,
  useActivateCarListing,
  useDeactivateCarListing,
  useMarkAsSoldListing,
  useMarkAsUnsoldListing
} from '@/hooks/useCarListings';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending_verification: { label: 'Pending', variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  verified: { label: 'Verified', variant: 'default' as const, className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  live: { label: 'Live', variant: 'default' as const, className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  rejected: { label: 'Rejected', variant: 'destructive' as const, className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
  sold: { label: 'Sold', variant: 'outline' as const, className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
  expired: { label: 'Expired', variant: 'outline' as const, className: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
};

interface CarListingsTableProps {
  data: CarListingWithRelations[];
  onEdit?: (listing: CarListingWithRelations) => void;
  onViewDetails?: (listing: CarListingWithRelations) => void;
}

export function CarListingsTable({ data, onEdit, onViewDetails }: CarListingsTableProps) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isPowerDesk = roles?.includes('powerdesk');

  // Hooks for actions
  const updateStatus = useUpdateListingStatus();
  const verifyListing = useVerifyCarListing();
  const deleteListing = useDeleteCarListing();
  const activateListing = useActivateCarListing();
  const deactivateListing = useDeactivateCarListing();
  const markAsSold = useMarkAsSoldListing();
  const markAsUnsold = useMarkAsUnsoldListing();

  const [selectedListing, setSelectedListing] = useState<CarListingWithRelations | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Action Handlers
  const handleVerify = async (id: string) => {
    try {
      await verifyListing.mutateAsync(id);
      toast.success('Listing verified successfully');
    } catch (error) {
      console.error('Error verifying listing:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'live' });
      toast.success('Listing published successfully');
    } catch (error) {
      console.error('Error publishing listing:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateListing.mutateAsync(id);
      toast.success('Listing activated and set to live');
    } catch (error) {
      console.error('Error activating listing:', error);
      toast.error('Failed to activate listing');
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateListing.mutateAsync(id);
      toast.success('Listing deactivated');
    } catch (error) {
      console.error('Error deactivating listing:', error);
      toast.error('Failed to deactivate listing');
    }
  };

  const handleMarkAsSold = async (id: string) => {
    try {
      await markAsSold.mutateAsync(id);
      toast.success('Listing marked as sold');
    } catch (error) {
      console.error('Error marking as sold:', error);
      toast.error('Failed to mark as sold');
    }
  };

  const handleMarkAsUnsold = async (id: string) => {
    try {
      await markAsUnsold.mutateAsync(id);
      toast.success('Listing reactivated successfully');
    } catch (error) {
      console.error('Error marking as unsold:', error);
      toast.error('Failed to reactivate listing');
    }
  };

  const handleDelete = async () => {
    if (!selectedListing) return;
    try {
      await deleteListing.mutateAsync(selectedListing.id);
      setShowDeleteDialog(false);
      setSelectedListing(null);
      toast.success('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/car/${id}`);
  };

  // Shared Actions Component
  const ListingActions = ({ listing }: { listing: CarListingWithRelations }) => (
    <div className="flex items-center gap-1">
      {!isMobile && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails ? onViewDetails(listing) : handleViewDetails(listing.id)}
          className="h-8"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onViewDetails ? onViewDetails(listing) : handleViewDetails(listing.id)}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit?.(listing)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>

          {/* Status Management Actions */}
          {listing.status !== 'live' && listing.status !== 'sold' && (
            <DropdownMenuItem onClick={() => handleActivate(listing.id)}>
              <Power className="mr-2 h-4 w-4 text-green-600" />
              Activate
            </DropdownMenuItem>
          )}
          {listing.status === 'live' && (
            <>
              <DropdownMenuItem onClick={() => handleDeactivate(listing.id)}>
                <PowerOff className="mr-2 h-4 w-4 text-orange-600" />
                Deactivate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleMarkAsSold(listing.id)}>
                <DollarSign className="mr-2 h-4 w-4 text-blue-600" />
                Mark as Sold
              </DropdownMenuItem>
            </>
          )}
          {listing.status === 'sold' && (
            <DropdownMenuItem onClick={() => handleMarkAsUnsold(listing.id)}>
              <Power className="mr-2 h-4 w-4 text-green-600" />
              Mark as Unsold
            </DropdownMenuItem>
          )}

          {/* PowerDesk Actions */}
          {isPowerDesk && (
            <>
              <DropdownMenuSeparator />
              {listing.status === 'pending_verification' && (
                <DropdownMenuItem onClick={() => handleVerify(listing.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify
                </DropdownMenuItem>
              )}
              {listing.status === 'verified' && (
                <DropdownMenuItem onClick={() => handlePublish(listing.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Publish to Live
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setSelectedListing(listing);
              setShowDeleteDialog(true);
            }}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Desktop Columns
  const columns: ColumnDef<CarListingWithRelations>[] = [
    {
      accessorKey: 'photos',
      header: 'Photo',
      cell: ({ row }) => {
        const photos = row.original.photos as any[];
        const thumbnail = photos?.[0]?.thumbnail_url || photos?.[0]?.url;
        return thumbnail ? (
          <img src={thumbnail} alt="Car" className="h-16 w-20 object-cover rounded" />
        ) : (
          <div className="h-16 w-20 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
            No Image
          </div>
        );
      },
    },
    {
      accessorKey: 'listing_id',
      header: 'Listing ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.listing_id || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'seller',
      header: 'Dealer/Seller',
      cell: ({ row }) => (
        <div className="space-y-1 min-w-[150px]">
          <div className="font-medium text-sm">{row.original.seller?.full_name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.city?.name}{row.original.city?.state ? `, ${row.original.city.state}` : ''}
          </div>
          {row.original.primary_phone && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {row.original.primary_phone}
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {row.original.seller_type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'car',
      header: 'Car Details',
      cell: ({ row }) => (
        <div className="space-y-1 min-w-[200px]">
          <div className="font-medium">
            {row.original.brand?.name} {row.original.model?.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.variant}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'year_of_make',
      header: 'Year',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.year_of_make}</span>
      ),
    },
    {
      accessorKey: 'transmission',
      header: 'Transmission',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.transmission?.name || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'fuel_type',
      header: 'Fuel',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.fuel_type?.name || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'owner_type',
      header: 'Ownership',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.owner_type?.name || 'N/A'}</span>
      ),
    },
    {
      accessorKey: 'kms_driven',
      header: 'KMS Driven',
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.kms_driven.toLocaleString()} km</span>
      ),
    },
    {
      accessorKey: 'expected_price',
      header: 'Price',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-semibold">₹{row.original.expected_price.toLocaleString()}</div>
          <Badge variant="secondary" className="text-xs">
            {row.original.price_type}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status as keyof typeof statusConfig;
        const config = statusConfig[status];
        return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
      },
    },
    {
      accessorKey: 'enquiry_count',
      header: 'Inquiries',
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{row.original.enquiry_count || 0}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total customer inquiries</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => <ListingActions listing={row.original} />,
    },
  ];

  return (
    <>
      {isMobile ? (
        <div className="grid grid-cols-1 gap-4">
          {data.map((listing) => {
            const status = listing.status as keyof typeof statusConfig;
            const config = statusConfig[status];
            const photos = listing.photos as any[];
            const thumbnail = photos?.[0]?.thumbnail_url || photos?.[0]?.url;

            return (
              <Card key={listing.id} className="overflow-hidden border-none shadow-sm bg-card">
                <div className="flex p-3 gap-3">
                  {/* Image */}
                  <div
                    className="h-24 w-24 shrink-0 rounded-lg bg-muted bg-cover bg-center"
                    style={{ backgroundImage: thumbnail ? `url(${thumbnail})` : undefined }}
                  >
                    {!thumbnail && <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No Image</div>}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-sm truncate pr-2">
                            {listing.brand?.name} {listing.model?.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{listing.variant}</p>
                        </div>
                        <ListingActions listing={listing} />
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <div className="font-bold text-base">₹{listing.expected_price.toLocaleString()}</div>
                        <Badge variant={config.variant} className={cn("text-[10px] px-1.5 py-0 h-5", config.className)}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                        <Calendar className="h-3 w-3" /> {listing.year_of_make}
                      </span>
                      <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                        <Fuel className="h-3 w-3" /> {listing.fuel_type?.name}
                      </span>
                      <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                        <Gauge className="h-3 w-3" /> {listing.kms_driven.toLocaleString()}km
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
