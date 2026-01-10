import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { FormModal } from '@/components/common/FormModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useFeatures, useCreateFeature, useUpdateFeature, useDeleteFeature, Feature } from '@/hooks/useFeatures';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FEATURE_CATEGORIES = [
  'Safety',
  'Comfort',
  'Technology',
  'Performance',
  'Exterior',
  'Interior',
  'Entertainment',
  'Convenience',
];

export function FeatureManager() {
  const { data: features = [], isLoading } = useFeatures();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState({ name: '', category: '', icon: '', is_active: true });
  const [validationError, setValidationError] = useState<string>('');

  // Reset form when modal opens for adding
  useEffect(() => {
    if (isModalOpen && !editingFeature) {
      setFormData({ name: '', category: '', icon: '', is_active: true });
      setValidationError('');
    }
  }, [isModalOpen, editingFeature]);

  // Sync form data with editing feature
  useEffect(() => {
    if (editingFeature) {
      setFormData({
        name: editingFeature.name,
        category: editingFeature.category || '',
        icon: editingFeature.icon || '',
        is_active: editingFeature.is_active
      });
      setValidationError('');
    }
  }, [editingFeature]);

  const checkDuplicate = (name: string, currentId?: string): boolean => {
    const trimmedName = name.trim().toLowerCase();
    return features.some(f => 
      f.name.toLowerCase() === trimmedName && f.id !== currentId
    );
  };

  const columns: ColumnDef<Feature>[] = [
    { accessorKey: 'name', header: 'Feature Name' },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        row.original.category ? (
          <Badge variant="outline">{row.original.category}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">Uncategorized</span>
        )
      ),
    },
    {
      accessorKey: 'icon',
      header: 'Icon',
      cell: ({ row }) => (
        row.original.icon ? (
          <span className="text-sm font-mono">{row.original.icon}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
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
            setEditingFeature(row.original);
            setFormData({ 
              name: row.original.name, 
              category: row.original.category || '', 
              icon: row.original.icon || '',
              is_active: row.original.is_active 
            });
            setIsModalOpen(true);
          }}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => deleteFeature.mutate(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = () => {
    // Trim and validate
    const trimmedName = formData.name.trim();
    
    if (!trimmedName) {
      setValidationError('Feature name is required');
      return;
    }

    // Check for duplicates
    if (checkDuplicate(trimmedName, editingFeature?.id)) {
      setValidationError(`A feature named "${trimmedName}" already exists. Please use a different name.`);
      return;
    }

    const submitData = {
      ...formData,
      name: trimmedName,
      category: formData.category || undefined,
      icon: formData.icon || undefined,
    };

    if (editingFeature) {
      // Only send changed fields
      const changes: any = {};
      if (submitData.name !== editingFeature.name) changes.name = submitData.name;
      if (submitData.category !== (editingFeature.category || '')) changes.category = submitData.category;
      if (submitData.icon !== (editingFeature.icon || '')) changes.icon = submitData.icon;
      if (submitData.is_active !== editingFeature.is_active) changes.is_active = submitData.is_active;

      if (Object.keys(changes).length === 0) {
        setValidationError('No changes detected');
        return;
      }

      updateFeature.mutate({ id: editingFeature.id, ...changes });
    } else {
      createFeature.mutate(submitData);
    }
    
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFeature(null);
    setFormData({ name: '', category: '', icon: '', is_active: true });
    setValidationError('');
  };

  const handleOpenAddModal = () => {
    setEditingFeature(null);
    setFormData({ name: '', category: '', icon: '', is_active: true });
    setValidationError('');
    setIsModalOpen(true);
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Features</CardTitle>
            <CardDescription>Manage vehicle features and specifications</CardDescription>
          </div>
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            Add Feature
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={features} searchKey="name" searchPlaceholder="Search features..." />
      </CardContent>

      <FormModal
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseModal();
          else setIsModalOpen(open);
        }}
        title={editingFeature ? `Edit Feature: ${editingFeature.name}` : 'Add New Feature'}
        onSubmit={handleSubmit}
        isLoading={createFeature.isPending || updateFeature.isPending}
      >
        <div className="space-y-4">
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Feature Name *</Label>
            <Input 
              id="name" 
              placeholder="e.g., ABS, Airbags" 
              value={formData.name} 
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setValidationError('');
              }} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {FEATURE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Icon Name (Lucide) (Optional)</Label>
            <Input id="icon" placeholder="e.g., Shield, Zap" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
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
