import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoryManager() {
  const { data: categories = [], isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', badge_color: '#3b82f6', is_active: true });

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: 'Category Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.original.badge_color || '#3b82f6' }} />
          <span>{row.original.name}</span>
        </div>
      ),
    },
    { accessorKey: 'description', header: 'Description' },
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
            setEditingCategory(row.original);
            setFormData({ 
              name: row.original.name, 
              description: row.original.description || '', 
              badge_color: row.original.badge_color || '#3b82f6',
              is_active: row.original.is_active 
            });
            setIsModalOpen(true);
          }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteCategory.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, ...formData });
    } else {
      createCategory.mutate(formData);
    }
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', badge_color: '#3b82f6', is_active: true });
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Car Categories</CardTitle>
            <CardDescription>Manage vehicle categories and classifications</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={categories} searchKey="name" searchPlaceholder="Search categories..." />
      </CardContent>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        onSubmit={handleSubmit}
        isLoading={createCategory.isPending || updateCategory.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Badge Color</Label>
            <div className="flex items-center gap-2">
              <Input id="color" type="color" value={formData.badge_color} onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })} className="w-20 h-10" />
              <Input value={formData.badge_color} onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })} className="flex-1" />
            </div>
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
