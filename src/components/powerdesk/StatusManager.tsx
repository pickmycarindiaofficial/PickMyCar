import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAvailabilityStatus, useCreateAvailabilityStatus, useUpdateAvailabilityStatus, useDeleteAvailabilityStatus,
  useOwnerTypes, useCreateOwnerType, useUpdateOwnerType, useDeleteOwnerType,
} from '@/hooks/useStatus';

export function StatusManager() {
  const [activeTab, setActiveTab] = useState('availability');
  
  // Availability Status
  const { data: availabilityStatuses = [], isLoading: availLoading } = useAvailabilityStatus();
  const createAvailStatus = useCreateAvailabilityStatus();
  const updateAvailStatus = useUpdateAvailabilityStatus();
  const deleteAvailStatus = useDeleteAvailabilityStatus();
  const [isAvailModalOpen, setIsAvailModalOpen] = useState(false);
  const [editingAvail, setEditingAvail] = useState<any>(null);
  const [availFormData, setAvailFormData] = useState({ name: '', color: '#22c55e', is_active: true });

  // Owner Types
  const { data: ownerTypes = [], isLoading: ownerLoading } = useOwnerTypes();
  const createOwnerType = useCreateOwnerType();
  const updateOwnerType = useUpdateOwnerType();
  const deleteOwnerType = useDeleteOwnerType();
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [ownerFormData, setOwnerFormData] = useState({ name: '', sort_order: 0, is_active: true });

  const availColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: 'Status Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.original.color || '#22c55e' }} />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setEditingAvail(row.original);
            setAvailFormData({ name: row.original.name, color: row.original.color || '#22c55e', is_active: row.original.is_active });
            setIsAvailModalOpen(true);
          }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteAvailStatus.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const ownerColumns: ColumnDef<any>[] = [
    { accessorKey: 'name', header: 'Owner Type' },
    { 
      accessorKey: 'sort_order', 
      header: 'Sort Order',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.sort_order ?? 0}</span>
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'default' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => {
            setEditingOwner(row.original);
            setOwnerFormData({ name: row.original.name, sort_order: row.original.sort_order ?? 0, is_active: row.original.is_active });
            setIsOwnerModalOpen(true);
          }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteOwnerType.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Management</CardTitle>
        <CardDescription>Manage availability status and owner types</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="availability">Availability Status</TabsTrigger>
            <TabsTrigger value="owner">Owner Types</TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAvailModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Status
              </Button>
            </div>
            {availLoading ? <Skeleton className="h-64" /> : <DataTable columns={availColumns} data={availabilityStatuses} searchKey="name" />}
          </TabsContent>

          <TabsContent value="owner" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsOwnerModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Owner Type
              </Button>
            </div>
            {ownerLoading ? <Skeleton className="h-64" /> : <DataTable columns={ownerColumns} data={ownerTypes} searchKey="name" />}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Availability Status Modal */}
      <FormModal
        open={isAvailModalOpen}
        onOpenChange={setIsAvailModalOpen}
        title={editingAvail ? 'Edit Availability Status' : 'Add Availability Status'}
        onSubmit={() => {
          editingAvail ? updateAvailStatus.mutate({ id: editingAvail.id, ...availFormData }) : createAvailStatus.mutate(availFormData);
          setIsAvailModalOpen(false);
          setEditingAvail(null);
          setAvailFormData({ name: '', color: '#22c55e', is_active: true });
        }}
        isLoading={createAvailStatus.isPending || updateAvailStatus.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status Name</Label>
            <Input value={availFormData.name} onChange={(e) => setAvailFormData({ ...availFormData, name: e.target.value })} placeholder="e.g., In Stock, Sold" />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <Input type="color" value={availFormData.color} onChange={(e) => setAvailFormData({ ...availFormData, color: e.target.value })} className="w-20 h-10" />
              <Input value={availFormData.color} onChange={(e) => setAvailFormData({ ...availFormData, color: e.target.value })} className="flex-1" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={availFormData.is_active} onCheckedChange={(checked) => setAvailFormData({ ...availFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>

      {/* Owner Type Modal */}
      <FormModal
        open={isOwnerModalOpen}
        onOpenChange={setIsOwnerModalOpen}
        title={editingOwner ? 'Edit Owner Type' : 'Add Owner Type'}
        onSubmit={() => {
          editingOwner ? updateOwnerType.mutate({ id: editingOwner.id, ...ownerFormData }) : createOwnerType.mutate(ownerFormData);
          setIsOwnerModalOpen(false);
          setEditingOwner(null);
          setOwnerFormData({ name: '', sort_order: 0, is_active: true });
        }}
        isLoading={createOwnerType.isPending || updateOwnerType.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Owner Type Name</Label>
            <Input value={ownerFormData.name} onChange={(e) => setOwnerFormData({ ...ownerFormData, name: e.target.value })} placeholder="e.g., 1st Owner, 2nd Owner" />
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input type="number" value={ownerFormData.sort_order} onChange={(e) => setOwnerFormData({ ...ownerFormData, sort_order: parseInt(e.target.value) })} placeholder="0" />
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={ownerFormData.is_active} onCheckedChange={(checked) => setOwnerFormData({ ...ownerFormData, is_active: checked })} />
            <Label>Active</Label>
          </div>
        </div>
      </FormModal>
    </Card>
  );
}
