import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useCities, useCreateCity, useUpdateCity, useDeleteCity, City } from '@/hooks/useCities';
import { Skeleton } from '@/components/ui/skeleton';

export function CityManager() {
  const { data: cities = [], isLoading } = useCities();
  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({ name: '', state: '', is_active: true });

  const columns: ColumnDef<City>[] = [
    { accessorKey: 'name', header: 'City Name' },
    { accessorKey: 'state', header: 'State' },
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
            setEditingCity(row.original);
            setFormData({ name: row.original.name, state: row.original.state || '', is_active: row.original.is_active });
            setIsModalOpen(true);
          }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteCity.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    if (editingCity) {
      updateCity.mutate({ id: editingCity.id, ...formData });
    } else {
      createCity.mutate(formData);
    }
    setIsModalOpen(false);
    setEditingCity(null);
    setFormData({ name: '', state: '', is_active: true });
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cities</CardTitle>
            <CardDescription>Manage cities where your service is available</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add City
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={cities} searchKey="name" searchPlaceholder="Search cities..." />
      </CardContent>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingCity ? 'Edit City' : 'Add New City'}
        onSubmit={handleSubmit}
        isLoading={createCity.isPending || updateCity.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">City Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
      </FormModal>
    </Card>
  );
}
