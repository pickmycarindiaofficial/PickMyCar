import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';
import { Building2, Eye, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dealer } from '@/hooks/useDealers';

interface ActiveDealersTableProps {
  dealers: Dealer[];
  onViewProfile: (dealerId: string) => void;
  onEditDetails: (dealerId: string) => void;
  onViewListings: (dealerId: string) => void;
  onSendMessage: (dealerId: string) => void;
  onSuspendAccount: (dealerId: string) => void;
  onEditProfileInfo?: (dealerId: string) => void;
}

export function ActiveDealersTable({ 
  dealers, 
  onViewProfile, 
  onEditDetails, 
  onViewListings, 
  onSendMessage, 
  onSuspendAccount,
  onEditProfileInfo
}: ActiveDealersTableProps) {
  const columns = [
    {
      accessorKey: 'full_name',
      header: 'Dealer Name',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.full_name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }: any) => (
        <span className="text-muted-foreground">@{row.original.username}</span>
      ),
    },
    {
      id: 'dealership',
      header: 'Dealership',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.is_pickmycar ? 'PickMyCar' : 'Independent Dealer'}</span>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: () => (
        <Badge variant="default" className="bg-green-600">
          Active
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewProfile(row.original.id)}>
              <Eye className="h-4 w-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditDetails(row.original.id)}>
              Edit Details
            </DropdownMenuItem>
            {onEditProfileInfo && (
              <DropdownMenuItem onClick={() => onEditProfileInfo(row.original.id)}>
                Edit Profile Info
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onViewListings(row.original.id)}>
              View Listings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSendMessage(row.original.id)}>
              Send Message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => onSuspendAccount(row.original.id)}
            >
              Suspend Account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return <DataTable columns={columns} data={dealers} searchKey="full_name" searchPlaceholder="Search dealers..." />;
}
